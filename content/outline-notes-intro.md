+++
title = "Outline notes introduction"
date = 2023-04-20
[taxonomies]
cat = ["notetaking"]
tags = ["vim", "outliners", "wiki"]
+++

I never managed to get personal wikis to quite work for me.
The idea is nice, you do a Wikipedia-style breakdown where each concept gets its own wiki page, and then hyperlink between these.
A problem is that when learning some new topic, it often explodes into dozens of new concepts, each of which could have their own wiki page.
The pages end up as stubs, and with a regular text editor, a sort of navigational fatigue sets in.
It takes extra effort to jump between pages, extra setup to show multiple of them next to each other on screen, and you might end up forgetting a page even is there if you don't have it linked in some index you view frequently.
At some point I realized I can relax the assumption of 1 concept --- 1 page --- 1 file for the personal wiki.
One file can have multiple concepts, just list them one after another and have some syntax convention for the headline of a new item.
I decided to go for old-school camel case WikiWords for the headline convention.
A new item is identified by its WikiWord title that is the only text on the line.
Any WikiWords elsewhere in text are treated as hyperlinks to the item.
You can now introduce a bunch of concepts by just giving them WikiWord names and typing those in a list.

Starting with a list of just the topic names on lines is basically an outline, and that gave me a second idea.
Back in 1999 Steve Litt [wrote about outlines and outliners](http://www.troubleshooters.com/tpromag/199911/199911.htm) as a tool for organizing projects and writing documents.
His stuff later led to the development of the [VimOutliner](https://github.com/vimoutliner/vimoutliner) plugin.
The concept is simple, you have nested lines, one thought per line, and you use indentation for nested structure.
This leads to a different writing style than prose text, everything starts out bullet points style.
The result is less readable for outsiders, but it's a very efficient "notes to self" format, which is often good enough for a personal wiki.
There's also a convention for organizing prose text in a file called [ventilated prose](https://writetheasciidocs.netlify.app/ventilated-prose) or [semantic linebreaks](https://sembr.org/), where you write normal text but put every sentence on its own line.
This works nicely with an outliner format, you just write full sentences for your bullet point items when you need proper prose.

A nice thing with the orthodox 1 concept --- 1 file wiki structure is that it is very simple.
You don't have to make structural decisions beyond coming up with concepts and naming them unambiguously.
With multiple concepts in one file, you must now decide which concepts belong together and which order they are presented in.
This can end up looking much like an article or a syllabus that presents some overarching narrative building on the individual topics.
It might also be a collection with less innate narrative structure that is just ordered alphabetically, like an encyclopedia, or chronologically, if all the items have some natural date associated with them.
The outline format adds another option for nesting items inside one another.
Now instead of articles, files start to feel like books, with a table of contents that expands to chapters and appendices.
You need to start thinking about the differences between "leaf articles" that are not split further, and "branch articles" that contain leaves.

These extra options don't actually preclude using the old-school wiki style.
Assuming you allow file names to work as page titles that apply to the entire contents of the file, the same way as WikiWord lines apply to the bodies of text under them, you can just make a named file for each concept and introduce no sub-pages inside them.
You can move from collection pages to individual ones by having "hatchery" pages that contain stubs of various associated items that haven't expanded enough to warrant their own file yet, and then split off parts to their own files when they have grown big enough.

I ended up just writing a bunch of VimOutliner files using these conventions and it works out fine.
I don't really need complex software on top of this, Vim already provides powerful text editing tools and I can use text search to navigate between concepts.
The system is still a bit primitive with just the outlines and article titles.
What about if you want topic tags beyond the single topic of a collection file, or want to introduce other structured metadata values?
The next part of the note-taking system is how you can embed those in the outlines.
