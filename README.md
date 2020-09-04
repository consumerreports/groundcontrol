***TODO***

- we prob want support for an arbitrary number of user-defined schemas -- e.g., we define a ruleset called "the digital standard" and create a schema for it and serialize it to disk... but another org uses ground control to manage testing for their custom fork of the digital standard, "the better digital standard," which actually adds some new fields and structures indicators differently -- so they need to be able to define a schema for "the better digital standard" and load it at runtime...

- might want to write an abstraction layer for jsonschema

- time to write a schema for the new unified .yml format

- build a new clean unified .yml from all the old files

- can we validate the new unified .yml?  run some tests, create some invalid edits, etc

- can we create multiple valid versions of the ds and compare nodes for equality, get diff, etc? 

- ~~"standards" is a better generalization of the digital standard than "rules" or "tests." the data is not tests, but rather it's the standard that should is used to devise the test.  and we're not expecting products to "follow rules" so much as we expect them to conform
to certain standards, which, you know, is probably why we called it the digital standard~~

***SCHEMA FOR A STANDARD***

note: we still gotta figure out how labels work. we're losing the semantics of the directory structure, so those labels need to become part of the standard schema. maybe just a LABEL type node, and a STANDARD object can keep a sequence of LABEL objects, where each label object can have as children either an EVALUATION object or another label object? this will not allow us to have uncategorized evaluations, but maybe that's desirable...

a STANDARD object consists of:
- a name
- a sequence of EVALUATION objects

an EVALUATION object (formerly a "test" object) consists of:
- a name
- a "readiness flag" (an integer over the interval [1, 3]) - be careful, the existing DS uses the string representation of an integer
- a sequence of CRITERIA objects

a CRITERIA object consists of:
- a name
- a sequence of INDICATOR objects

an INDICATOR object consists of:
- name (note that the existing DS is a bit inconsistent here, every other object has a property called "name," but indicators are just called "indicator" - should clean this up)
- a sequence of PROCEDURE objects

a PROCEDURE object consists of:
- a description (in the current DS, the procedure is just a string, but we should prob wrap it in an object with some other metadata)
