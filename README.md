# Ground Control

This is prototype grade software! Use at your own risk.

### Requirements

Node.js > 12

### Installation

```bash
git clone https://github.com/noahlevenson/groundcontrol

cd groundcontrol

npm i
```

### Usage

```bash
cd src/gcsh

node gcsh.js
```

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
