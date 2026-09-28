/**
 * LearnFlow — Real Content Pack
 *
 * A curated set of REAL learning content (books, quizzes, flashcards,
 * learning paths) used by both:
 *   - server/seed.js            (full destructive seed for fresh databases)
 *   - server/seed-content.js    (safe additive seed for existing databases)
 *
 * Everything here is IDEMPOTENT: seedRealContent() upserts by natural keys
 * (subject name, book title, chapter number, quiz title, question text,
 *  flashcard front+topic, path title, node order) and never deletes anything,
 * so it is safe to run against a database that already has user data.
 */

const Subject = require('../models/Subject');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Flashcard = require('../models/Flashcard');
const LearningPath = require('../models/LearningPath');
const LearningPathNode = require('../models/LearningPathNode');

// ---------------------------------------------------------------- subjects
const subjects = [
  { name: 'Web Development', description: 'Learn modern web development technologies' },
  { name: 'Data Structures & Algorithms', description: 'Master the data structures and algorithms behind technical interviews' },
  { name: 'Databases', description: 'SQL, data modelling and how modern data systems work' },
  { name: 'Computer Science Core', description: 'Operating systems, networks and other CS fundamentals' },
  { name: 'Software Engineering', description: 'Write clean, maintainable, professional-grade code' },
];

// -------------------------------------------------------------------- books
const books = [
  {
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    subject: 'Web Development',
    difficulty: 'Beginner',
    description: 'A modern introduction to programming with JavaScript — from values and functions to asynchronous programming and Node.js.',
    coverImage: 'https://via.placeholder.com/300x400/f7df1e/000000?text=Eloquent+JavaScript',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Values, Types, and Operators',
        pages: 8,
        content: `# Chapter 1: Values, Types, and Operators

Every JavaScript program manipulates *values*: numbers, pieces of text, true/false flags. Understanding the type system is the foundation of the language.

## Primitive types

- **Numbers**: \`typeof 42\` → \`"number"\`. All numbers are 64-bit floats, so \`0.1 + 0.2\` is \`0.30000000000000004\` — never compare floats with \`===\`.
- **Strings**: single, double, or backticks. Backticks allow interpolation: \\\`\\\`\\\`js
  const name = "Aarya";
  console.log(\\\`Hello, \\\${name}!\\\`); // Hello, Aarya!
  \\\`\\\`\\\`
- **Booleans**: \`true\` / \`false\`, produced by comparisons.
- **Empty values**: \`undefined\` (no value assigned yet) and \`null\` (intentionally empty).

## Operators

Arithmetic (\`+\`, \`-\`, \`*\`, \`/\`, \`%\`), comparison (\`<\`, \`>\`, \`<=\`, \`>=\`), and the two equalities: loose \`==\` (converts types — avoid it) vs strict \`===\` (no conversion — prefer it).

\\\`\\\`\\\`js
console.log("5" == 5);   // true  (type coercion!)
console.log("5" === 5);  // false (different types)
\\\`\\\`\\\`

## Logical operators

\`&&\`, \`||\`, and \`!\` follow short-circuiting: \`a && b\` returns \`a\` if it is falsy, otherwise \`b\`. This is why you see patterns like \`name || "Guest"\` for defaults.

**Takeaway:** always use \`===\`, beware float arithmetic, and reach for template literals when building strings.`,
      },
      {
        chapterNumber: 2,
        title: 'Program Structure and Functions',
        pages: 10,
        content: `# Chapter 2: Program Structure and Functions

Programs are built from *bindings* (variables), *control flow*, and *functions*.

## Bindings

\\\`\\\`\\\`js
let mood = "focused";   // reassignable
const pi = 3.14159;     // constant binding
mood = "curious";       // OK
// pi = 3;              // TypeError!
\\\`\\\`\\\`

Prefer \`const\` by default; use \`let\` only when reassignment is needed. Never use \`var\` in modern code — it has function scope instead of block scope and causes subtle bugs.

## Functions

Functions wrap a piece of program in a value you can call later:

\\\`\\\`\\\`js
function square(x) {
  return x * x;
}
const cube = (x) => x * x * x;  // arrow function
console.log(square(4)); // 16
\\\`\\\`\\\`

## Scope

Each function call creates a fresh scope. Bindings declared inside are invisible outside — this isolation is what makes large programs manageable.

## Key ideas

- A **pure function** always returns the same output for the same input and causes no side effects — prefer them.
- Keep functions **small and single-purpose**; a function doing three things should be three functions.
- Name functions with verbs: \`calculateTotal\`, not \`total2\`.

**Takeaway:** master \`let\`/\`const\`, arrow functions, and scope now — closures, modules, and async patterns all build on these.`,
      },
    ],
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    subject: 'Software Engineering',
    difficulty: 'Intermediate',
    description: 'The classic handbook of agile software craftsmanship — how to write code that humans can read, maintain, and trust.',
    coverImage: 'https://via.placeholder.com/300x400/1f2937/ffffff?text=Clean+Code',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Meaningful Names',
        pages: 7,
        content: `# Chapter 1: Meaningful Names

Names are everywhere in code — variables, functions, classes, files. Choosing them well is the cheapest way to make code readable.

## Intention-revealing names

A name should answer *why it exists, what it does, and how it is used*:

\\\`\\\`\\\`js
// Bad
const d = 5; // days? dollars? distance?

// Good
const daysSinceLastLogin = 5;
\\\`\\\`\\\`

If a name needs a comment to explain it, the name is wrong.

## Rules of thumb

- **Avoid disinformation**: don't call a list of accounts \`accountList\` unless it really is a \`List\` — \`accounts\` or \`accountGroup\` is safer.
- **Make meaningful distinctions**: \`getData\` vs \`fetchData\` tells the reader nothing. Say what data: \`getUserProfile\`.
- **Use pronounceable, searchable names**: \`generationTimestamp\` beats \`genymdhms\`; you can actually discuss the former in a conversation.
- **Class names are nouns** (\`Customer\`, \`OrderProcessor\`); **method names are verbs** (\`save\`, \`calculateTotal\`).
- **One concept, one word**: don't mix \`fetch\`, \`retrieve\`, and \`get\` for the same operation — pick one and be consistent.

## The Boy Scout Rule preview

Leave the code cleaner than you found it — and renaming a misleading variable is the smallest, safest cleanup there is.

**Takeaway:** naming is a design activity, not an afterthought. Spend the extra ten seconds; every future reader (including you) will thank you.`,
      },
      {
        chapterNumber: 2,
        title: 'Functions',
        pages: 9,
        content: `# Chapter 2: Functions

Functions are the verbs of a program — and the first place clean code lives or dies.

## Small!

The first rule of functions: they should be **small**. The second rule: they should be **smaller than that**. A function should rarely exceed 20 lines; ideally it does one thing at a single level of abstraction.

## Do one thing

> Functions should do one thing. They should do it well. They should do it only.

How do you know it does one thing? If you can extract another function from it with a name that isn't a restatement of the original, it was doing more than one thing.

## Few arguments

The ideal number of arguments is **zero** (niladic), then one (monadic), then two (dyadic). Three or more (polyadic) needs a very good reason — readers must remember each argument's meaning and order. Bundle related arguments into an object:

\\\`\\\`\\\`js
// Hard to read at the call site
createUser("Aarya", "aarya@example.com", true, false, "admin");

// Better
createUser({ name: "Aarya", email: "aarya@example.com", role: "admin" });
\\\`\\\`\\\`

## No side effects

A function named \`checkPassword\` should not also send a welcome email. Hidden side effects are lies the code tells its readers — if it must do them, say so in the name.

**Takeaway:** short, well-named, single-purpose functions with few arguments. When in doubt, extract.`,
      },
    ],
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    subject: 'Databases',
    difficulty: 'Advanced',
    description: 'The definitive guide to the architecture of modern data systems — reliability, scalability, storage engines, and distributed data.',
    coverImage: 'https://via.placeholder.com/300x400/7c3aed/ffffff?text=DDIA',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Reliable, Scalable, and Maintainable Applications',
        pages: 12,
        content: `# Chapter 1: Reliable, Scalable, and Maintainable Applications

Most applications today are *data-intensive* (the amount and complexity of data is the challenge) rather than *compute-intensive*. Three concerns dominate their design:

## 1. Reliability — "it keeps working"

Reliability means the system continues to work correctly even when things go wrong. Kleppmann distinguishes:

- **Faults**: something going wrong (a disk dies, a network blips) — inevitable.
- **Failures**: the system as a whole stops serving users — what we must prevent.

Techniques: no single point of failure, thorough testing, monitoring, and designing for *human* faults too (most outages involve operator error — good tooling and guardrails matter more than blame).

## 2. Scalability — "it handles growth"

Scalability is not "handles 10x traffic" in the abstract — it is the ability to cope with *increased load*, and we must first describe load precisely (requests/sec, read/write ratio, active users).

- **Latency vs response time**: latency is waiting for a request; response time is what the client sees (includes queueing).
- Look at **percentiles**, not averages: p50, p95, p99. Averages hide the slow tail that real users feel.
- Scale **up** (bigger machine) vs **out** (more machines) — and know that stateless services scale out far more easily than stateful data systems.

## 3. Maintainability — "we can keep working on it"

The majority of software cost is maintenance. Design for three audiences:

- **Operability**: can the ops team run it? Good monitoring, sane defaults, easy rollbacks.
- **Simplicity**: can a newcomer understand it? Remove accidental complexity.
- **Evolvability**: can requirements change? Agile-friendly data models and APIs.

**Takeaway:** every data-system decision is a trade-off between these three. There are no perfect architectures — only well-understood trade-offs.`,
      },
      {
        chapterNumber: 2,
        title: 'Data Models and Query Languages',
        pages: 11,
        content: `# Chapter 2: Data Models and Query Languages

Data models are the most important part of software design — they shape how we *think* about the problem, not just how we store bytes.

## The relational model wins (mostly)

Tables of rows, SQL queries, joins — the relational model has survived 50 years because it is a superb general-purpose tool: declarative queries, ACID transactions, and a clean separation between logical schema and physical storage.

## The document model

JSON-like documents (MongoDB, CouchDB) shine when your data is naturally hierarchical and self-contained:

\\\`\\\`\\\`json
{
  "name": "Aarya",
  "courses": [
    { "title": "Databases 101", "progress": 72 }
  ]
}
\\\`\\\`\\\`

No joins needed to fetch a user and their courses — one read gets the whole aggregate (**data locality**). The price: updating duplicated data in many documents, and weaker multi-document guarantees (though modern document DBs now offer transactions).

## Schema flexibility — schemaless or schema-on-read?

- **Schema-on-write** (relational): the database enforces structure up front. Safe, but migrations can be painful.
- **Schema-on-read** (document): the application interprets structure. Flexible, but pushes validation discipline onto every writer.

Neither is "schemaless" in practice — production systems always end up with an implicit schema in code.

## Choosing

- Highly interconnected data with complex many-to-many queries → relational + joins.
- Aggregate-oriented access, evolving schemas → documents.
- Special shapes (graphs, time series, full text) → purpose-built stores.

**Takeaway:** pick the model that matches your *access patterns*, not hype. Most real systems are polyglot — relational at the core, specialised stores at the edges.`,
      },
    ],
  },
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    subject: 'Data Structures & Algorithms',
    difficulty: 'Advanced',
    description: 'CLRS — the standard textbook on algorithms: design techniques, analysis, and the classic problems every engineer should know.',
    coverImage: 'https://via.placeholder.com/300x400/0f766e/ffffff?text=CLRS',
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Role of Algorithms in Computing',
        pages: 9,
        content: `# Chapter 1: The Role of Algorithms in Computing

An **algorithm** is any well-defined computational procedure that takes some input and produces output — a tool for solving a computational problem.

## Why study algorithms?

1. **Efficiency matters at scale.** Sorting 10 items: any method works. Sorting 10 million records for a database index: the algorithm *is* the product. An \\\\Theta(n log n) merge sort vs \\\\Theta(n²) insertion sort is the difference between seconds and hours.
2. **They are the technology.** The internet, databases, graphics, machine learning — all rest on algorithms plus the hardware that runs them. Total system performance depends on *both* choosing efficient algorithms *and* fast hardware.
3. **Interview and design currency.** Recognising that a problem reduces to shortest-path, or that a cache needs an LRU structure, is a daily engineering skill.

## What makes a "good" algorithm?

- **Correctness**: produces the right output for every valid input.
- **Resource usage**: time and memory as functions of input size *n*, expressed in asymptotic notation (Big-O, Big-\\\\Theta).
- **Simplicity and generality** where performance allows.

## A motivating comparison

Insertion sort (\\\\Theta(n²)) vs merge sort (\\\\Theta(n log n)) on n = 10⁷: even on a machine 1000× slower, merge sort wins by orders of magnitude. **Algorithms beat hardware.**

**Takeaway:** this book teaches you to *design* correct algorithms and *analyse* their cost — the two halves of every serious performance decision.`,
      },
      {
        chapterNumber: 2,
        title: 'Getting Started: Insertion Sort and Loop Invariants',
        pages: 10,
        content: `# Chapter 2: Getting Started — Insertion Sort and Loop Invariants

We begin with sorting: given a sequence, rearrange it into nondecreasing order. Insertion sort is simple, and it teaches the analysis machinery used throughout the book.

## The algorithm

Like sorting playing cards in your hand: take each new card and insert it into the already-sorted prefix.

\\\`\\\`\\\`
INSERTION-SORT(A):
  for j = 2 to A.length:
    key = A[j]
    i = j - 1
    while i > 0 and A[i] > key:
      A[i+1] = A[i]
      i = i - 1
    A[i+1] = key
\\\`\\\`\\\`

## Loop invariants — proving correctness

A **loop invariant** is a property true before and after each iteration:

> *At the start of each iteration, subarray A[1..j−1] holds the original elements, sorted.*

- **Initialization**: j=2, so A[1..1] is trivially sorted. ✔
- **Maintenance**: the inner loop shifts larger elements right and inserts \`key\` in its correct spot, so A[1..j] is sorted. ✔
- **Termination**: j = n+1, so A[1..n] is sorted. ✔

This three-step pattern proves *any* loop correct — learn it cold.

## Running time

Best case (sorted input): \\\\Theta(n). Worst case (reverse sorted): \\\\Theta(n²) — the inner while loop does j−1 shifts for each j.

**Takeaway:** insertion sort is \\\\Theta(n²) worst-case but excellent for tiny or nearly-sorted inputs — which is why library sorts (e.g. Timsort) use it as a subroutine.`,
      },
    ],
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    subject: 'Software Engineering',
    difficulty: 'Beginner',
    description: 'Timeless advice on the craft of programming — from DRY and orthogonality to debugging, testing, and career thinking.',
    coverImage: 'https://via.placeholder.com/300x400/b45309/ffffff?text=Pragmatic+Programmer',
    chapters: [
      {
        chapterNumber: 1,
        title: 'A Pragmatic Philosophy',
        pages: 8,
        content: `# Chapter 1: A Pragmatic Philosophy

Being a *pragmatic programmer* is an attitude: you care about your craft, think beyond the immediate ticket, and take responsibility for outcomes.

## Core tenets

- **Care about your craft.** Why spend your life writing software unless you care about doing it well? Pride in workmanship shows in the small things: naming, tests, commit messages.
- **Think! About your work.** Turn off the autopilot. Before typing, ask: is there a simpler way? What could go wrong? Who reads this next?
- **Provide options, don't make lame excuses.** "It can't be done" is rarely true. Instead: "Here are three approaches with their trade-offs — I recommend option two because…"
- **Don't live with broken windows.** Small neglect signals that nobody cares, and entropy accelerates. Fix the messy function, the failing test, the outdated doc *now*.
- **Be a catalyst for change.** You can't force a whole team to adopt a practice — but you can demonstrate it, make it easy, and let results persuade.

## Knowledge portfolio

Treat your knowledge like an investment portfolio:

- **Invest regularly** — learn one new thing deliberately, every week.
- **Diversify** — a new language each year, plus one technical and one non-technical book per quarter.
- **Review and rebalance** — drop obsolete skills, double down on what compounds.

**Takeaway:** pragmatism is *adaptability plus responsibility*. Tools change; the habit of thinking critically about your work is the durable skill.`,
      },
      {
        chapterNumber: 2,
        title: 'DRY — The Evils of Duplication',
        pages: 7,
        content: `# Chapter 2: DRY — The Evils of Duplication

> **Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.**

This is the **DRY principle** (Don't Repeat Yourself) — the single most violated rule in programming.

## It's about knowledge, not keystrokes

DRY is widely misunderstood as "don't copy-paste code". The real target is *duplicated knowledge*: the same business rule, validation, or data shape expressed in two places. When the rule changes, will you remember to change *both*? You won't.

Common duplications:

- **Imposed duplication**: the same value required in two formats — e.g. a date shown as "28/09/2026" in the UI but stored as ISO in the DB. Derive one from the other.
- **Inadvertent duplication**: two modules that *happen* to share logic today but represent different concepts. Don't merge them prematurely — wait until the duplication is real.
- **Documentation vs code**: comments restating what the code obviously does rot instantly. Document the *why*, not the *what*.

## The cost

Duplication multiplies maintenance: every fix must be applied N times, and the N−1 you forget become bugs. Worse, duplicated code *drifts* — the copies slowly disagree, and nobody knows which is authoritative.

## Remedies

Extract shared logic into functions/modules, use code generation or metadata for repetitive structure, and normalise data (the database world learned this as *normalization* decades ago).

**Takeaway:** before duplicating, ask "am I repeating *knowledge*?" If yes, extract it. DRY is what makes change cheap — and cheap change is the whole game.`,
      },
    ],
  },
];

// ------------------------------------------------------------------- quizzes
const quizzes = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Test your grasp of JS types, scope, functions, and array methods.',
    topic: 'JavaScript',
    subject: 'Web Development',
    difficulty: 'Beginner',
    questions: [
      {
        questionText: 'What is the result of `typeof null` in JavaScript?',
        options: ['"null"', '"object"', '"undefined"', '"boolean"'],
        correctOptionIndex: 1,
        topic: 'Types',
      },
      {
        questionText: 'Which statement about `let` and `var` is TRUE?',
        options: [
          '`let` is function-scoped while `var` is block-scoped',
          '`let` is block-scoped while `var` is function-scoped',
          'Both are block-scoped',
          'Both are hoisted with their values intact',
        ],
        correctOptionIndex: 1,
        topic: 'Scope',
      },
      {
        questionText: 'What does `Array.prototype.map()` return?',
        options: [
          'It modifies the original array in place and returns it',
          'A new array with the callback applied to each element',
          'The first element that satisfies the callback',
          'A boolean indicating whether all elements passed the test',
        ],
        correctOptionIndex: 1,
        topic: 'Arrays',
      },
      {
        questionText: 'What is a closure in JavaScript?',
        options: [
          'A function that closes over variables from its outer scope, keeping them alive',
          'A way to permanently delete a variable from memory',
          'An object with no prototype',
          'A loop that terminates when a condition closes',
        ],
        correctOptionIndex: 0,
        topic: 'Functions',
      },
      {
        questionText: 'Why is `"5" === 5` false while `"5" == 5` is true?',
        options: [
          '`===` compares memory addresses, `==` compares values',
          '`==` performs type coercion before comparing, `===` does not',
          '`===` only works on numbers',
          'Both are always identical; the premise is wrong',
        ],
        correctOptionIndex: 1,
        topic: 'Operators',
      },
    ],
  },
  {
    title: 'Data Structures & Algorithms',
    description: 'Big-O, classic structures, and the patterns behind coding interviews.',
    topic: 'DSA',
    subject: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    questions: [
      {
        questionText: 'What is the time complexity of binary search on a sorted array of n elements?',
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        correctOptionIndex: 1,
        topic: 'Complexity',
      },
      {
        questionText: 'Which data structure uses the LIFO (Last-In-First-Out) discipline?',
        options: ['Queue', 'Stack', 'Heap', 'Linked list'],
        correctOptionIndex: 1,
        topic: 'Data Structures',
      },
      {
        questionText: 'What is the worst-case time complexity of quicksort?',
        options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(2ⁿ)'],
        correctOptionIndex: 2,
        topic: 'Sorting',
      },
      {
        questionText: 'Breadth-first search (BFS) on a graph is naturally implemented with which auxiliary structure?',
        options: ['A stack', 'A queue', 'A priority queue', 'A hash set only'],
        correctOptionIndex: 1,
        topic: 'Graphs',
      },
      {
        questionText: 'Which of these is a valid strategy for resolving hash collisions?',
        options: [
          'Increasing the load factor indefinitely',
          'Chaining (separate linked lists per bucket)',
          'Deleting the colliding key',
          'Sorting the keys before hashing',
        ],
        correctOptionIndex: 1,
        topic: 'Hashing',
      },
    ],
  },
  {
    title: 'SQL & Databases',
    description: 'Core SQL clauses, keys, joins, and normalization concepts.',
    topic: 'SQL',
    subject: 'Databases',
    difficulty: 'Beginner',
    questions: [
      {
        questionText: 'Which clause filters rows AFTER grouping in SQL?',
        options: ['WHERE', 'HAVING', 'FILTER', 'GROUP WHERE'],
        correctOptionIndex: 1,
        topic: 'Queries',
      },
      {
        questionText: 'A PRIMARY KEY must always be…',
        options: [
          'An integer auto-increment column',
          'Unique and NOT NULL',
          'A foreign key to another table',
          'Indexed in descending order',
        ],
        correctOptionIndex: 1,
        topic: 'Keys',
      },
      {
        questionText: 'Which JOIN returns all rows from the left table, with NULLs where the right table has no match?',
        options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'FULL JOIN'],
        correctOptionIndex: 1,
        topic: 'Joins',
      },
      {
        questionText: 'First Normal Form (1NF) requires that…',
        options: [
          'Every table has a primary key',
          'All column values are atomic (no repeating groups)',
          'There are no transitive dependencies',
          'All foreign keys are indexed',
        ],
        correctOptionIndex: 1,
        topic: 'Normalization',
      },
      {
        questionText: 'Which statement permanently removes an entire table including its data and schema?',
        options: ['DELETE TABLE users;', 'TRUNCATE users;', 'DROP TABLE users;', 'REMOVE TABLE users;'],
        correctOptionIndex: 2,
        topic: 'DDL',
      },
    ],
  },
  {
    title: 'Operating Systems',
    description: 'Processes, threads, memory management, and concurrency primitives.',
    topic: 'Operating Systems',
    subject: 'Computer Science Core',
    difficulty: 'Intermediate',
    questions: [
      {
        questionText: 'What is the key difference between a process and a thread?',
        options: [
          'Processes share memory; threads have isolated memory',
          'Threads of the same process share memory; processes are isolated',
          'Threads cannot run concurrently',
          'There is no difference on modern operating systems',
        ],
        correctOptionIndex: 1,
        topic: 'Processes',
      },
      {
        questionText: 'Which of the following is one of the four necessary conditions for deadlock?',
        options: ['Paging', 'Circular wait', 'Preemption', 'Spooling'],
        correctOptionIndex: 1,
        topic: 'Concurrency',
      },
      {
        questionText: 'In paging, memory is divided into…',
        options: [
          'Variable-sized segments matching program structure',
          'Fixed-size blocks called pages and frames',
          'One contiguous region per process',
          'Compressed chunks that grow on demand',
        ],
        correctOptionIndex: 1,
        topic: 'Memory',
      },
      {
        questionText: 'Which CPU scheduling algorithm is preemptive and gives each process a fixed time slice?',
        options: ['FCFS', 'SJF', 'Round Robin', 'Priority (non-preemptive)'],
        correctOptionIndex: 2,
        topic: 'Scheduling',
      },
      {
        questionText: 'How does a mutex differ from a counting semaphore?',
        options: [
          'A mutex allows multiple holders; a semaphore allows one',
          'A mutex is a binary lock with ownership (only the locker unlocks); a semaphore is a counter with no ownership',
          'Semaphores only work between processes, mutexes only between threads',
          'They are identical; the names are interchangeable',
        ],
        correctOptionIndex: 1,
        topic: 'Synchronization',
      },
    ],
  },
  {
    title: 'Computer Networks',
    description: 'TCP/IP, DNS, HTTP, and how data moves across the internet.',
    topic: 'Networking',
    subject: 'Computer Science Core',
    difficulty: 'Beginner',
    questions: [
      {
        questionText: 'What is the main trade-off of UDP compared to TCP?',
        options: [
          'UDP is reliable but slower; TCP is fast but lossy',
          'UDP is faster with no delivery guarantees; TCP is reliable and ordered but has more overhead',
          'UDP only works on LANs; TCP only works on WANs',
          'There is no difference; they are two names for the same protocol',
        ],
        correctOptionIndex: 1,
        topic: 'Transport',
      },
      {
        questionText: 'What does DNS resolve?',
        options: [
          'IP addresses to MAC addresses',
          'Domain names to IP addresses',
          'URLs to file paths',
          'Ports to protocols',
        ],
        correctOptionIndex: 1,
        topic: 'DNS',
      },
      {
        questionText: 'What is the default port for HTTP?',
        options: ['443', '21', '80', '8080'],
        correctOptionIndex: 2,
        topic: 'HTTP',
      },
      {
        questionText: 'How many bits long is an IPv4 address?',
        options: ['16 bits', '32 bits', '64 bits', '128 bits'],
        correctOptionIndex: 1,
        topic: 'Addressing',
      },
      {
        questionText: 'Which device forwards packets between different networks?',
        options: ['Hub', 'Switch', 'Router', 'Repeater'],
        correctOptionIndex: 2,
        topic: 'Devices',
      },
    ],
  },
];

// --------------------------------------------------------------- flashcards
const flashcards = [
  // JavaScript
  { front: 'What is a closure in JavaScript?', back: 'A function bundled with references to its surrounding scope. The inner function "remembers" outer variables even after the outer function has returned.', topic: 'JavaScript', subject: 'Web Development' },
  { front: 'What is hoisting?', back: 'The behaviour where var declarations and function declarations are moved to the top of their scope during compilation — so you can call a function before its definition line, but `let`/`const` stay in the temporal dead zone.', topic: 'JavaScript', subject: 'Web Development' },
  { front: '`==` vs `===` — which should you use and why?', back: 'Always prefer `===` (strict equality). `==` performs type coercion ("5" == 5 is true), which causes subtle bugs. `===` compares without conversion.', topic: 'JavaScript', subject: 'Web Development' },
  { front: 'Describe the JavaScript event loop in one sentence.', back: 'JS runs on a single thread: the call stack executes code, while async callbacks wait in queues and run only when the stack is empty.', topic: 'JavaScript', subject: 'Web Development' },
  { front: 'What are the three states of a Promise?', back: 'pending → settled as either fulfilled (resolved with a value) or rejected (failed with a reason). Once settled, a promise never changes state.', topic: 'JavaScript', subject: 'Web Development' },
  { front: 'How does `this` behave in an arrow function vs a regular function?', back: 'Arrow functions inherit `this` from their enclosing scope (lexical this). Regular functions get `this` from how they are called (object method, plain call, new, etc.).', topic: 'JavaScript', subject: 'Web Development' },
  // DSA / Big-O
  { front: 'What does Big-O notation describe?', back: 'The upper bound of an algorithm\u2019s growth rate — how time or space scales as input size n grows, ignoring constants and lower-order terms.', topic: 'Big-O & DSA', subject: 'Data Structures & Algorithms' },
  { front: 'Time complexity of binary search?', back: 'O(log n) — each step halves the search space, but the array must be sorted first.', topic: 'Big-O & DSA', subject: 'Data Structures & Algorithms' },
  { front: 'Stack vs queue — access discipline of each?', back: 'Stack is LIFO (push/pop from one end — e.g. call stack, undo). Queue is FIFO (enqueue at rear, dequeue at front — e.g. task scheduling, BFS).', topic: 'Big-O & DSA', subject: 'Data Structures & Algorithms' },
  { front: 'What is the defining property of a Binary Search Tree?', back: 'For every node: all keys in the left subtree are smaller, all keys in the right subtree are larger. Enables O(log n) search on balanced trees.', topic: 'Big-O & DSA', subject: 'Data Structures & Algorithms' },
  { front: 'Name two ways to handle hash collisions.', back: '1) Chaining — each bucket holds a linked list of entries. 2) Open addressing — probe for the next free slot (linear/quadratic probing, double hashing).', topic: 'Big-O & DSA', subject: 'Data Structures & Algorithms' },
  { front: 'BFS vs DFS — when would you pick each?', back: 'BFS (queue) finds shortest paths in unweighted graphs and explores level by level. DFS (stack/recursion) is simpler for connectivity, topological sort, and exploring deep paths with less memory.', topic: 'Big-O & DSA', subject: 'Data Structures & Algorithms' },
  // SQL
  { front: 'What is a PRIMARY KEY?', back: 'A column (or set of columns) that uniquely identifies each row. It must be UNIQUE and NOT NULL, and each table has at most one.', topic: 'SQL', subject: 'Databases' },
  { front: 'What is a FOREIGN KEY?', back: 'A column referencing the primary key of another table. It enforces referential integrity — you cannot insert a row pointing to a non-existent parent.', topic: 'SQL', subject: 'Databases' },
  { front: 'INNER JOIN vs LEFT JOIN?', back: 'INNER JOIN returns only rows with matches in both tables. LEFT JOIN returns ALL left-table rows, filling NULLs where the right table has no match.', topic: 'SQL', subject: 'Databases' },
  { front: 'What does an INDEX do, and what is its cost?', back: 'An index speeds up lookups/filters on a column (like a book\u2019s index). Cost: extra storage and slower writes, since the index must be maintained on every INSERT/UPDATE/DELETE.', topic: 'SQL', subject: 'Databases' },
  { front: 'What does ACID stand for in transactions?', back: 'Atomicity (all-or-nothing), Consistency (valid state to valid state), Isolation (concurrent transactions don\u2019t interfere), Durability (committed data survives crashes).', topic: 'SQL', subject: 'Databases' },
  { front: 'What problem does normalization solve?', back: 'It eliminates redundant data and update anomalies by organizing tables so each fact is stored once (1NF: atomic values, 2NF: no partial dependencies, 3NF: no transitive dependencies).', topic: 'SQL', subject: 'Databases' },
  // Operating Systems
  { front: 'Process vs thread?', back: 'A process is an isolated program in execution with its own memory. A thread is a lightweight unit inside a process; threads of one process share memory but have separate stacks.', topic: 'Operating Systems', subject: 'Computer Science Core' },
  { front: 'What are the four conditions for deadlock?', back: 'Mutual exclusion, hold-and-wait, no preemption, and circular wait. Break any one of them to prevent deadlock.', topic: 'Operating Systems', subject: 'Computer Science Core' },
  { front: 'Paging vs segmentation?', back: 'Paging splits memory into fixed-size pages/frames (simple, no external fragmentation). Segmentation splits by logical units like code/stack (variable sizes, can fragment).', topic: 'Operating Systems', subject: 'Computer Science Core' },
  { front: 'What is a context switch?', back: 'The OS saving one process/thread\u2019s CPU state (registers, program counter) and loading another\u2019s so it can run. It is pure overhead — fast switches matter for responsiveness.', topic: 'Operating Systems', subject: 'Computer Science Core' },
  { front: 'What is virtual memory?', back: 'An abstraction giving each process its own private address space, mapped to physical RAM (and disk) by the MMU. Enables isolation, larger-than-RAM programs, and demand paging.', topic: 'Operating Systems', subject: 'Computer Science Core' },
  { front: 'Mutex vs semaphore?', back: 'A mutex is a binary lock with ownership — only the thread that locked it may unlock it. A semaphore is a counter allowing N concurrent holders, with no ownership concept.', topic: 'Operating Systems', subject: 'Computer Science Core' },
  // Git
  { front: 'What does `git commit` actually store?', back: 'A snapshot of your staged files plus metadata (author, message, parent commit) as an immutable object identified by a SHA-1 hash — not a diff, a full snapshot.', topic: 'Git', subject: 'Software Engineering' },
  { front: 'What is a branch in Git?', back: 'A lightweight movable pointer to a commit. Creating a branch just writes a 41-byte file — branching is instant and merging is the normal workflow, not an exceptional event.', topic: 'Git', subject: 'Software Engineering' },
  { front: 'Merge vs rebase?', back: 'Merge preserves history with a merge commit (truthful, can get noisy). Rebase rewrites commits onto a new base for a linear history (clean, but never rebase shared/public branches).', topic: 'Git', subject: 'Software Engineering' },
  { front: '`git fetch` vs `git pull`?', back: '`fetch` downloads remote changes into remote-tracking branches without touching your work. `pull` = fetch + merge (or rebase) into your current branch.', topic: 'Git', subject: 'Software Engineering' },
  { front: 'What is `git stash` for?', back: 'Temporarily shelving uncommitted changes so you can switch branches or pull cleanly, then re-applying them later with `git stash pop`.', topic: 'Git', subject: 'Software Engineering' },
  { front: 'What does `.gitignore` do?', back: 'Lists files/patterns Git should never track (node_modules, .env, build output). It only affects untracked files — already-tracked files need `git rm --cached`.', topic: 'Git', subject: 'Software Engineering' },
];

// ------------------------------------------------------------ learning paths
const learningPaths = [
  {
    title: 'Full-Stack Web Development',
    description: 'From JavaScript foundations to writing maintainable production code.',
    subject: 'Web Development',
    difficulty: 'Beginner',
    estimatedDuration: '8 weeks',
    nodes: [
      { title: 'JavaScript Values & Types', description: 'Master types, operators, and equality before writing real programs.', order: 1, contentType: 'chapter', bookTitle: 'Eloquent JavaScript', chapterNumber: 1 },
      { title: 'Program Structure & Functions', description: 'Bindings, scope, and functions — the core building blocks.', order: 2, contentType: 'chapter', bookTitle: 'Eloquent JavaScript', chapterNumber: 2 },
      { title: 'Name Things Well', description: 'Apply Clean Code naming rules to everything you write.', order: 3, contentType: 'chapter', bookTitle: 'Clean Code', chapterNumber: 1 },
      { title: 'Functions Done Right', description: 'Small, single-purpose functions with few arguments.', order: 4, contentType: 'chapter', bookTitle: 'Clean Code', chapterNumber: 2 },
    ],
  },
  {
    title: 'DSA for Coding Interviews',
    description: 'Algorithmic thinking and analysis, the CLRS way.',
    subject: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    estimatedDuration: '6 weeks',
    nodes: [
      { title: 'Why Algorithms Matter', description: 'Correctness, efficiency, and why algorithms beat hardware.', order: 1, contentType: 'chapter', bookTitle: 'Introduction to Algorithms', chapterNumber: 1 },
      { title: 'Insertion Sort & Loop Invariants', description: 'Your first algorithm plus the proof technique for all loops.', order: 2, contentType: 'chapter', bookTitle: 'Introduction to Algorithms', chapterNumber: 2 },
      { title: 'Sorting & Order Statistics (Part II)', description: 'Work through heapsort, quicksort, and linear-time selection in the full book.', order: 3, contentType: 'book', bookTitle: 'Introduction to Algorithms' },
      { title: 'Implement Everything You Read', description: 'Code each algorithm from scratch — reading is not learning.', order: 4, contentType: 'book', bookTitle: 'Introduction to Algorithms' },
    ],
  },
  {
    title: 'Relational Database Design',
    description: 'Think clearly about data systems, then model them well.',
    subject: 'Databases',
    difficulty: 'Intermediate',
    estimatedDuration: '4 weeks',
    nodes: [
      { title: 'Reliability, Scalability, Maintainability', description: 'The three lenses for every data-system decision.', order: 1, contentType: 'chapter', bookTitle: 'Designing Data-Intensive Applications', chapterNumber: 1 },
      { title: 'Data Models & Query Languages', description: 'Relational vs document models and how to choose.', order: 2, contentType: 'chapter', bookTitle: 'Designing Data-Intensive Applications', chapterNumber: 2 },
      { title: 'Storage Engines Deep Dive', description: 'Read Part II of the book: LSM-trees, B-trees, and column stores.', order: 3, contentType: 'book', bookTitle: 'Designing Data-Intensive Applications' },
      { title: 'Design Your Own Schema', description: 'Model a real application schema and justify every trade-off.', order: 4, contentType: 'book', bookTitle: 'Designing Data-Intensive Applications' },
    ],
  },
  {
    title: 'JavaScript Deep Dive',
    description: 'Go beyond syntax: types, scope, and functions done properly.',
    subject: 'Web Development',
    difficulty: 'Intermediate',
    estimatedDuration: '3 weeks',
    nodes: [
      { title: 'Values, Types & Operators', description: 'The type system, coercion pitfalls, and template literals.', order: 1, contentType: 'chapter', bookTitle: 'Eloquent JavaScript', chapterNumber: 1 },
      { title: 'Functions & Scope', description: 'Closures start here — master scope now.', order: 2, contentType: 'chapter', bookTitle: 'Eloquent JavaScript', chapterNumber: 2 },
      { title: 'Finish the Book', description: 'Higher-order functions, objects, async, and modules.', order: 3, contentType: 'book', bookTitle: 'Eloquent JavaScript' },
      { title: 'Build Three Mini-Projects', description: 'A todo app, a quiz app, and a small game — no tutorials.', order: 4, contentType: 'book', bookTitle: 'Eloquent JavaScript' },
    ],
  },
  {
    title: 'The Pragmatic Coder',
    description: 'Level up from writing code that works to code that lasts.',
    subject: 'Software Engineering',
    difficulty: 'Beginner',
    estimatedDuration: '2 weeks',
    nodes: [
      { title: 'A Pragmatic Philosophy', description: 'Care about your craft and think about your work.', order: 1, contentType: 'chapter', bookTitle: 'The Pragmatic Programmer', chapterNumber: 1 },
      { title: 'DRY — The Evils of Duplication', description: 'Single source of truth for every piece of knowledge.', order: 2, contentType: 'chapter', bookTitle: 'The Pragmatic Programmer', chapterNumber: 2 },
      { title: 'Meaningful Names', description: 'Naming as a design activity, Clean Code style.', order: 3, contentType: 'chapter', bookTitle: 'Clean Code', chapterNumber: 1 },
      { title: 'Keep Your Knowledge Portfolio Growing', description: 'Invest weekly in learning; review the whole shelf yearly.', order: 4, contentType: 'book', bookTitle: 'The Pragmatic Programmer' },
    ],
  },
];

// ------------------------------------------------------------------- seeder
async function seedRealContent() {
  const counts = { subjects: 0, books: 0, chapters: 0, quizzes: 0, questions: 0, flashcards: 0, learningPaths: 0, pathNodes: 0 };

  // Subjects (idempotent by name)
  const subjectMap = {};
  for (const s of subjects) {
    let doc = await Subject.findOne({ name: s.name });
    if (!doc) {
      doc = await Subject.create(s);
      counts.subjects++;
    }
    subjectMap[s.name] = doc;
  }

  // Books + chapters (idempotent by title / book+chapterNumber)
  const bookMap = {};
  for (const b of books) {
    let book = await Book.findOne({ title: b.title });
    if (!book) {
      book = await Book.create({
        title: b.title,
        author: b.author,
        subject: subjectMap[b.subject]._id,
        difficulty: b.difficulty,
        description: b.description,
        coverImage: b.coverImage,
      });
      counts.books++;
    }
    bookMap[b.title] = book;
    for (const ch of b.chapters) {
      const exists = await Chapter.findOne({ book: book._id, chapterNumber: ch.chapterNumber });
      if (!exists) {
        await Chapter.create({
          book: book._id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
          pages: ch.pages,
        });
        counts.chapters++;
      }
    }
  }

  // Quizzes + questions (idempotent by title / quiz+questionText)
  for (const q of quizzes) {
    let quiz = await Quiz.findOne({ title: q.title });
    if (!quiz) {
      quiz = await Quiz.create({
        title: q.title,
        description: q.description,
        topic: q.topic,
        subject: subjectMap[q.subject]._id,
        difficulty: q.difficulty,
      });
      counts.quizzes++;
    }
    for (const [i, qs] of q.questions.entries()) {
      const exists = await QuizQuestion.findOne({ quiz: quiz._id, questionText: qs.questionText });
      if (!exists) {
        await QuizQuestion.create({
          quiz: quiz._id,
          questionText: qs.questionText,
          options: qs.options,
          correctOptionIndex: qs.correctOptionIndex,
          topic: qs.topic,
          order: i,
        });
        counts.questions++;
      }
    }
  }

  // Flashcards (idempotent by front+topic)
  for (const f of flashcards) {
    const exists = await Flashcard.findOne({ front: f.front, topic: f.topic });
    if (!exists) {
      await Flashcard.create({
        front: f.front,
        back: f.back,
        topic: f.topic,
        subject: subjectMap[f.subject]._id,
      });
      counts.flashcards++;
    }
  }

  // Learning paths + nodes (idempotent by title / path+order)
  for (const lp of learningPaths) {
    let path = await LearningPath.findOne({ title: lp.title });
    if (!path) {
      path = await LearningPath.create({
        title: lp.title,
        description: lp.description,
        subject: subjectMap[lp.subject]._id,
        difficulty: lp.difficulty,
        estimatedDuration: lp.estimatedDuration,
      });
      counts.learningPaths++;
    }
    for (const n of lp.nodes) {
      const exists = await LearningPathNode.findOne({ learningPath: path._id, order: n.order });
      if (!exists) {
        const bookDoc = bookMap[n.bookTitle];
        let chapterId;
        if (n.contentType === 'chapter') {
          const chDoc = await Chapter.findOne({ book: bookDoc._id, chapterNumber: n.chapterNumber });
          chapterId = chDoc ? chDoc._id : undefined;
        }
        const prev = await LearningPathNode.findOne({ learningPath: path._id, order: n.order - 1 });
        await LearningPathNode.create({
          learningPath: path._id,
          title: n.title,
          description: n.description,
          order: n.order,
          prerequisiteNodeIds: prev ? [prev._id] : [],
          contentType: n.contentType,
          book: bookDoc._id,
          ...(chapterId ? { chapter: chapterId } : {}),
        });
        counts.pathNodes++;
      }
    }
  }

  return counts;
}

module.exports = { seedRealContent, subjects, books, quizzes, flashcards, learningPaths };
