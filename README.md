# Ground Control

Ground Control is a system for managing and applying mutable standards as part of a standards-based technology testing program. If you test products or services -- and the standards you apply during testing are subject to complex and frequent changes -- Ground Control can help.

Ground Control was developed at [Consumer Reports Digital Lab](https://digital-lab.consumerreports.org/) to address the specific challenges associated with applying [The Digital Standard](https://thedigitalstandard.org/) as part of a rigorous and ongoing product testing program.

### Software system

Ground Control API

gcsh

web client (coming soon)

### Requirements

Node.js > 12

### Installation

```bash
git clone https://github.com/noahlevenson/groundcontrol

cd groundcontrol/src

npm i
```

### Usage

```bash
cd src/gcsh

node gcsh.js
```

### Mutable standards: the problem space

If you're serious about product testing, then you must not only apply standards in a rigorous way at test time -- you must also be able to look back at your test history and understand how and why previous tests were performed. If your standards are constantly evolving, it's hard to do this gracefully. Given a consumer product, tested many times over an interval of several years, how do you perform meaningful longitudinal comparisons if your testing standard (and corresponding methodologies) have changed along the way? When your standard is a community-maintained living document like [The Digital Standard](https://thedigitalstandard.org/), this question becomes even harder to answer.

Ground Control models this challenge as a state management problem and solves it using two functional programming-ish ideas:

1. Declare our data immutably<sup>1</sup>
2. Express our outputs (like test plans) as functions which map values to new values, rather than state

<sup>1</sup> We haven't yet implemented immutable data storage. Want to work on it together? Become a contributor.

### Integration with external services

Ground Control can use the Google Sheets API to write and fetch data; this functionality is implemented as a gcdata module through a simplified PUT/GET interface ([src/gcdata/store/gcstore_gs.js](https://github.com/noahlevenson/groundcontrol/blob/master/src/gcdata/store/gcstore_gs.js)). To take advantage of Google Sheets integration, you'll need to drop your own valid API credential in [src/gcenv](https://github.com/noahlevenson/groundcontrol/tree/master/src/gcenv). *Consumer Reports staff should contact noah.levenson@consumer.org to obtain an API credential.* 

### Open questions

**Best unique identifiers**: Currently, nodes in a standard are referred to using some integer value as enumerated by DFS inorder traversal -- e.g. 27 or 431 or 83. Is this optimal? The human-enumerated scheme which predates Ground Control manages to embed some useful semantic information in each unique identifier -- e.g., "S3.1.4.1" obviously has a hierarchical relationship to S3.1.4, and the S prefix tells us something about what category this node belongs to. However, there is at least one benefit to short, simple integer values: they're easier to input via command line, as might be required to map a node to a vector, or to seek to a node to display its description.  

**An immutable datastore**: It looks like everything should be immutable. Immutability is the key to understanding the past. Should we enforce an immutable datastore? It would solve a lot of our fears around human error. (e.g., what good will it do you to have the hash of a standard if a human accidentally deleted the data that hashes to that value?) However, this REALLY doesn't vibe with our "everything can also be a file" approach. 

**Structuring test results data**: Since Ground Control was devised to navigate the evolving interactions between large amounts of highly mutable data (standards and testable entities), the core design philosophy is to keep as little state as possible. Thus, the Ground Control way to express high level combinations of data -- like testplans -- is as a function of some immutable state. Testplan generation, in math terms, is just a sequence of set operations: we find the intersection of the set of evaluations in a standard, the set of evaluations in an evaluation set, and the set of evaluations mapped to the vectors of a testable entity. Accordingly -- while test results are determined by an evaluation process that is external to Ground Control -- we think of the *structure* of any given test results are essentially a function over (standard, evaluation set, testable entity). So the Ground Control way to express a testplan is not as some unit of data describing the testplan, but rather, as a tuple of (standard, evaluation set, testable entity) to pass to the testplan function. The simplest and best way to model test results is probably as a hashmap, where each key is a reference to some node in a standard, and each value is the result recorded by testing personnel. However, this fails to associate test results with a specific testable entity, which is a key requirement. In the short term, our focus is on supporting legacy workbook generation. Workbooks, as mutable data structures which combine test results with cached parts of a standard and other metadata, are nice for humans to work with, but are unsuitable for structuring test results in the Ground Control system. So, a question remains: How do we structure and capture test results representing one "test event," which may be acquired by a human operator over some interval of time? 

### Source layout & system design

**gcapp**: High level API - to start a new instance of Ground Control, instantiate a Gcapp object

**gcdata**: Data I/O abstraction, the goal is to define a simple I/O interface and write a lot of modules to support different ways to read/write data (local filesystem, databases, the cloud, etc.) if we enforce immutability, it gets enforced here

**gcenv**: Drop your client secrets/tokens/environment stuff here, this is where all modules should look for it

**gclog**: Logging and messaging, with hooks to set your own functionality

**gcsh**: Ground Control shell - a command line interface for GC

**gcstd**: Standards module - data structures and functionality for defining and transforming standards, including standard evaluation sets

**gctax**: Taxonomy module - data structures and functionality for defining and transforming a taxonomy of testable entities and exploring relationships between them

**gctypes**: Core low level data structures and algorithms, like trees, BFS, DFS, etc.

**gcutil**: Runtime utilities like hashing and debugging functions, but also dev utilities like file transformers and such

### Dependencies

TK - list dependencies here, explain why we're using them... jsonschema, js-yaml, googleapis@39, jsdoc as a dev dependency, anything else?  

### TODO

- go through all the TODOs. there are a lot!

- ~~we prob want support for an arbitrary number of user-defined schemas. we might define a ruleset called "the digital standard" and create a schema for it and serialize it to disk... but another org might use ground control to manage testing for their custom fork of the digital standard, "the better digital standard," which actually adds some new fields and structures indicators differently -- so they need to be able to define a schema for "the better digital standard" and load it at runtime...~~

- might want to write an abstraction layer for jsonschema

- ~~time to write a schema for the new unified .yml format~~

- ~~build a new clean unified .yml from all the old files~~

- ~~can we validate the new unified .yml?  run some tests, create some invalid edits, etc~~

- ~~can we create multiple valid versions of the ds and compare nodes for equality, get diff, etc?~~

- ~~"standards" is a better generalization of the digital standard than "rules" or "tests." the data is not tests, but rather it's the standard that should is used to devise the test.  and we're not expecting products to "follow rules" so much as we expect them to conform
to certain standards, which, you know, is probably why we called it the digital standard~~

- here's a problem: since we validate as JSON (because there isn't a good YAML schema validation library for Node.js), we lose formatting (and other?) info from the YAML. what do we want to do about this? do this in python just to use yamale, or write our own yaml schema validation lib? 

- how should we enforce a standard YAML style? (e.g., no quotes on strings except for single quotes to stringify numeric types)

- ~~for split schemas, how do we get jsonschema to pass recursively nested errors down the stack?~~

### How to address formatting issues found in the legacy digital standard repo?

1. Multiline strings... oh boy. There's lots of newlines in strings, often inconsistently -- sometimes one break between sentences, somes two or more. However, at least some of these newlines may be required to format this stuff on the web? I'm not really sure. A better world to move towards is one where there are no special characters in the YAML, but rather each separate entity in the data is represented properly as a separate object, and the static site build process formats each entity as desired. But this may require some coordination with the folks at Ocupop...

2.  Are the string formatting indicators being preserved correctly? Should we get rid of these thingS?

3.  Some evaluations have blank procedures, while some have "TBD"...
