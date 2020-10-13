***TODO***

- we prob want support for an arbitrary number of user-defined schemas. we might define a ruleset called "the digital standard" and create a schema for it and serialize it to disk... but another org might use ground control to manage testing for their custom fork of the digital standard, "the better digital standard," which actually adds some new fields and structures indicators differently -- so they need to be able to define a schema for "the better digital standard" and load it at runtime...

- might want to write an abstraction layer for jsonschema

- ~~time to write a schema for the new unified .yml format~~

- ~~build a new clean unified .yml from all the old files~~

- ~~can we validate the new unified .yml?  run some tests, create some invalid edits, etc~~

- can we create multiple valid versions of the ds and compare nodes for equality, get diff, etc? 

- ~~"standards" is a better generalization of the digital standard than "rules" or "tests." the data is not tests, but rather it's the standard that should is used to devise the test.  and we're not expecting products to "follow rules" so much as we expect them to conform
to certain standards, which, you know, is probably why we called it the digital standard~~

- here's a problem: since we validate as JSON (because there isn't a good YAML schema validation library for Node.js), we lose formatting (and other?) info from the YAML. what do we want to do about this? do this in python just to use yamale, or write our own yaml schema validation lib? 

- how should we enforce a standard YAML style? (e.g., no quotes on strings except for single quotes to stringify numeric types)

- ~~for split schemas, how do we get jsonschema to pass recursively nested errors down the stack?~~

***A BIG DEVIATION FROM OUR CURRENT SYSTEM TO THINK ABOUT***
In the current reality, products are defined solely by the parts of the digital standard that apply to them.  In other words:  When a new widget appears, we define what a widget is – and what consumers need to worry about when it comes to widgets – by opening up the digital standard and looking at each indicator, and thinking:  Is there any way in which this indicator applies to a widget?  

This is a bit weird, because a healthy way of modeling a problem usually entails defining each entity on its own terms:  i.e., define a widget by the COMPONENTS of a widget – that way, even in the absence of the digital standard, we still have some unit of data to refer to that describes what a widget is. 

Accordingly, our current approach is likely to give us a lot of painful problems.  For example:  If a widget is defined in part by indicator 76, what happens if, over time, the community decides that indicator 76 should no longer be part of the digital standard – and that it should be replaced by two newer indicators which better explore the criteria?  When indicator 76 is deleted, maybe there are 100 different products that are defined in part by indicator 76.  To bring the system up to date, someone will need to find and edit each of the 100 products and replace indicator 76 with the two newer indicators.

A better design would decouple the digital standard from the products themselves.  In other words: if products had a modular system of attributes, and we could associate parts of the digital standard with attributes – it would mean that we could make arbitrary changes to the digital standard without needing to make changes to every single product that it affects.

For example:  If there is a “WiFi Module” attribute that we assign to every product that has a WiFi module – and indicator 76 is assigned to the WiFi Module attribute – then when the community deletes indicator 76 from the digital standard, and replaces it with two newer indicators – someone must only update the WiFi Module attribute to link the two new indicators, and all of the products in the system are automatically up to date.  

In this system, when a new widget appears, we would define the widget by its attributes – i.e., a WiFi module, an optical disk drive, a password-based authentication system, etc.  At test time, a product’s attributes provide the links back to the parts of the digital standard that will be applied.

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

***HOW SHOULD WE ADDRESS THESE FORMATTING ISSUES?***

1. Multiline strings... oh boy. There's lots of newlines in strings, often inconsistently -- sometimes one break between sentences, somes two or more. However, at least some of these newlines may be required to format this stuff on the web? I'm not really sure. A better world to move towards is one where there are no special characters in the YAML, but rather each separate entity in the data is represented properly as a separate object, and the static site build process formats each entity as desired. But this may require some coordination with the folks at Ocupop...

2.  Are the string formatting indicators being preserved correctly?

3.  Some evaluations have blank procedures, while some have "TBD"...

4.  There seems to be some inconsistency in how procedures are formatted, but it may also be intentional. If you look at "Security (Is it safe?)," you'll see that the procedures, instead of being structured as multiple elements in the procedures array, are structured as a procedures array containing one procedure that is actually a bunch of procedures separated by newlines. Is this because they're a special class of procedures, or is it a mistake? Another issue: for "Known Exploit Resistance," multiple procedures run together in the same element but separated by newlines are assigned to subheadings -- "Browsers," "Apps," and "Connected Devices" -- but this prevents us from performing operations on a per-procedure basis. It's troublesome to split these procedures into discrete nodes, because they will no longer be associated with the subheading -- unless we modify the strings to add back the subheading to each individual procedure.
