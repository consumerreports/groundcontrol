# Ground Control

Ground Control is a system for managing testing programs which employ highly mutable standards. If you test products or services -- and the standards you apply during testing are subject to complex and frequent changes -- Ground Control can help.

Ground Control was developed at [Consumer Reports Digital Lab](https://digital-lab.consumerreports.org/) to address the specific challenges associated with applying [The Digital Standard](https://thedigitalstandard.org/) as part of a rigorous and ongoing product testing program.

### :notebook: Documentation

[Ground Control API](https://consumerreports.github.io/groundcontrol)

gcsh

web client (coming soon)

### :nerd_face: Requirements

Node.js > 12

### :floppy_disk: Installation

```bash
git clone https://github.com/consumerreports/groundcontrol

cd groundcontrol/src

npm i
```

### :brain: Usage

```bash
cd src/gcsh

node gcsh.js
```

### :alien: Mutable standards: the problem space

If you're serious about product testing, then you must not only apply standards in a rigorous way at test time -- you must also be able to look back at past test history and understand how and why previous tests were performed. This can become quite challenging if your standards change over time. Given some testable widget whose behaviors you'd like to study longitudinally, it's not immediately clear how to compare multiple test events spread over a period of time if the standards you applied at each test event may have prescribed differing test domains and methodologies.

This is a foundational problem for us to solve at Consumer Reports Digital Lab -- because we apply [The Digital Standard](https://thedigitalstandard.org) -- a living, open source consensus which is subject to ongoing evolution.  

We model the challenge as a state management problem and solve it by borrowing two ideas from functional programming:

1. Declare our data immutably<sup>1</sup>
2. Express our outputs (e.g. test plans) as functions which map values to new values, rather than state

<sup>1</sup> We haven't yet implemented immutable data storage. Want to work on it together? Become a contributor.

### :motorway: Roadmap

Ground Control is currently in prototype stage. Here's what's coming next:

Immutable data storage

Web client

### :electric_plug: Integration with external services

Ground Control can use the Google Sheets API to write and fetch data; this functionality is implemented as a gcdata module through a simplified PUT/GET interface ([src/gcdata/store/gcstore_gs.js](https://github.com/noahlevenson/groundcontrol/blob/master/src/gcdata/store/gcstore_gs.js)). 

To take advantage of Google Sheets integration, you'll need to drop your own valid API credential in [src/gcenv](https://github.com/noahlevenson/groundcontrol/tree/master/src/gcenv).

### :pray: Dependencies

[jsonschema](https://www.npmjs.com/package/jsonschema)
Used widely for object validation. Standards are currently defined as jsonschema schemas.

[js-yaml](https://www.npmjs.com/package/js-yaml)
Used to serialize and deserialize YML. Ground Control currently uses YML as its serialization format.
