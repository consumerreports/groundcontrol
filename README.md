***TODO***

- we prob want support for an arbitrary number of user-defined schemas. we might define a ruleset called "the digital standard" and create a schema for it and serialize it to disk... but another org might use ground control to manage testing for their custom fork of the digital standard, "the better digital standard," which actually adds some new fields and structures indicators differently -- so they need to be able to define a schema for "the better digital standard" and load it at runtime...

- might want to write an abstraction layer for jsonschema

- time to write a schema for the new unified .yml format

- build a new clean unified .yml from all the old files

- can we validate the new unified .yml?  run some tests, create some invalid edits, etc

- can we create multiple valid versions of the ds and compare nodes for equality, get diff, etc? 

- ~~"standards" is a better generalization of the digital standard than "rules" or "tests." the data is not tests, but rather it's the standard that should is used to devise the test.  and we're not expecting products to "follow rules" so much as we expect them to conform
to certain standards, which, you know, is probably why we called it the digital standard~~

- here's a problem: since we validate as JSON (because there isn't a good YAML schema validation library for Node.js), we lose formatting (and other?) info from the YAML. what do we want to do about this? do this in python just to use yamale, or write our own yaml schema validation lib? 

***SCHEMA FOR A STANDARD***

a STANDARD node consists of:
- a name (required)
- a sequence of LABEL nodes (min 1)

a LABEL node consists of:
- a name (required)
- a mixed sequence of LABEL and EVALUATION nodes (min 1) [use jsonschema anyOf to validate mixed types]

an EVALUATION node (formerly a "test" node) consists of:
- a name (required)
- a "readiness flag" (required) (an integer over the interval [1, 3]) - be careful, the existing DS uses the string representation of an integer
- a sequence of CRITERIA nodes (min 1)

a CRITERIA node consists of:
- a name (required)
- a sequence of INDICATOR nodes (min 1)

an INDICATOR node consists of:
- name (required) (note that the existing DS is a bit inconsistent here, every other object has a property called "name," but indicators are just called "indicator" - should clean this up)
- a sequence of PROCEDURE nodes (min 1)

a PROCEDURE node consists of:
- a description (required) (in the current DS, the procedure is just a string, but we should prob wrap it in a type with some other metadata)
