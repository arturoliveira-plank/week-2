# LangGraph.js Concepts: A Comprehensive Guide

This document explains key LangGraph.js concepts for building dynamic, parallel, and controlled workflows, based on examples from March 18, 2025. Each section includes explanations and insights from practical code snippets.

---

## 1. Branching and Parallelism

### Overview
- **Branching**: Splitting a workflow into multiple paths (e.g., from one node to several).
- **Parallelism**: Executing multiple nodes simultaneously to improve efficiency.
- **Fan-out**: Splitting to multiple nodes; **Fan-in**: Merging results back together.

### Example: Simple Fan-Out/Fan-In
- **Graph**: START -> A -> (B, C) -> D -> END
- A splits to B and C (branching), which run in parallel (parallelism), then merge at D.
- **State**: aggregate (array of strings) with a reducer to concatenate updates.
- **Output**: ["I'm A", "I'm B", "I'm C", "I'm D"].

### Key Difference
- **Branching**: Structural (defines paths).
- **Parallelism**: Execution (runs independent nodes at once).

---

## 2. Conditional Branching

### Overview
- Dynamically chooses paths based on state using `.addConditionalEdges()` and a routing function.
- Allows flexibility in workflows where the next steps depend on conditions.

### Example: Conditional Paths
- **Graph**: START -> A -> (B, C) or (C, D) -> E -> END
- **State**: aggregate (strings) and which (e.g., "bc" or "cd") to decide paths.
- **Routing Function**:
  ```javascript
  function routeCDorBC(state) {
    return state.which === "cd" ? ["c", "d"] : ["b", "c"];
  }
  ```
- **Output**:
  - which = "bc": ["I'm A", "I'm B", "I'm C", "I'm E"]
  - which = "cd": ["I'm A", "I'm C", "I'm D", "I'm E"]

### Why Use It?
- Adapts the workflow dynamically while maintaining parallelism for chosen nodes.

---

## 3. Stable Sorting

### Overview
- Ensures consistent ordering of results from parallel nodes, which otherwise might vary due to concurrent execution.
- Uses a separate state field (e.g., fanoutValues) and a "sink" node to sort results.

### Example: Sorting by Reliability
- **Graph**: START -> A -> (B, C) or (C, D) -> E -> END
- **State**:
  - aggregate: Final output.
  - fanoutValues: Temporary storage for parallel node outputs with scores.
- **Nodes**:
  - B (score 0.1), C (0.9), D (0.3) store { value, score } in fanoutValues.
  - E sorts by score (descending) and updates aggregate.
- **Output**:
  - which = "bc": ["I'm A", "I'm C", "I'm B", "I'm E"] (C > B)
  - which = "cd": ["I'm A", "I'm C", "I'm D", "I'm E"] (C > D)

### Why Use It?
- Guarantees predictable order (e.g., by reliability) despite parallelism.

---

## 4. Map-Reduce Branches

### Overview
- **Map**: Applies a function to each item in a list in parallel.
- **Reduce**: Aggregates results.
- Uses the Send API to dynamically create parallel tasks for an unknown number of items.

### Example: Joke Generation
- **Graph**: START -> generateTopics -> (generateJoke for each subject) -> bestJoke -> END
- **State**:
  - OverallState: topic, subjects, jokes (with reducer), bestSelectedJoke.
  - JokeState: subject for each generateJoke.
- **Flow**:
  - generateTopics: Creates subjects (e.g., ["lion", "elephant"]).
  - continueToJokes: Maps each subject to generateJoke via Send.
  - bestJoke: Picks the best joke.
- **Output**: e.g., "Why don't elephants use computers? Because they're afraid of the mouse!"

### Why Use It?
- Scales dynamically to process variable-length lists in parallel.

---

## 5. Control Flow and State Updates with Command

### Overview
- Combines state updates and routing in a single node using the Command object.
- Simplifies graphs by reducing the need for separate conditional edges.

### Example: Dynamic Routing
- **Flat Graph**: START -> A -> (B or C)
  - nodeA: Updates foo to "a" and randomly picks B or C:
    ```javascript
    return new Command({ update: { foo: "a" }, goto: Math.random() > 0.5 ? "nodeB" : "nodeC" });
    ```
  - **Output**: e.g., { foo: "a|b" } or { foo: "a|c" }.
- **Subgraph**: START -> subgraph(A) -> (B or C in parent)
  - nodeA in subgraph uses graph: Command.PARENT to route to parent nodes.

### Why Use It?
- Streamlines control flow and state management in one step.

---

## 6. Loops and Control

### Overview
- Loops repeat nodes until a condition is met (via conditional edges) or a recursion limit is hit.
- A superstep is one iteration or parallel group execution.

### Example: Simple Loop
- **Graph**: START -> A -> (route) -> B -> A -> ... -> END
- **Condition**: Loops until aggregate.length >= 7.
- **Output**: ["A", "B", "A", "B", "A", "B", "A"].
- **Recursion Limit**: Stops at 4 supersteps if set (e.g., A, B, A, B).

### Example: Loop with Branches
- **Graph**: START -> A -> (route) -> B -> (C, D in parallel) -> A -> ... -> END
- **Supersteps per Loop**: 4 (A, B, C+D, A).
- **Output**: ["A", "B", "C", "D", "A", "B", "C", "D", "A"] (2 loops + 1).
- **Recursion Limit**: Stops after 4 supersteps (1 loop).