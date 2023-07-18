:title Implicit data markup
:date 2023-04-22
:tags cs/rust cs/idm org/notes

**tl;dr**: Minimalist, non-self-describing markup and serialization language optimized for human-writability, with an implementation for Rust's Serde, available at [github](https://github.com/rsaarelm/idm) and [crates.io](https://crates.io/crates/idm).

My [initial note-taking system](/outline-notes-intro) had a good system for nested, wiki-like note-taking, but it was a bit lacking in any sort of principled metadata system.
You can do a lot with an uniform structured data syntax, but many of the existing ones are ugly and verbose or just otherwise awkward to type by hand.

I wanted a notation that's simple to write by hand, does not involve awkward blobs of machine-generated cruft, and generally stays out of your way.
One example of a syntax getting in your way is how JSON requires you to add quotation marks around every string value.

S-expressions used in Lisp are a very simple universal data format, but they are formed with parentheses, not with indentation.
The nested outlines format suggests using a structure based on newlines and semantically significant indentation instead.

## Outlines as expressions

It turns out that there are propositions for S-expressions that use indentation instead of parentheses, like [SRFI 49](https://srfi.schemers.org/srfi-49/srfi-49.html).
A rough idea is to replace atoms with lines and lists with nested blocks.
There is a problem though, how do you distinguish `((a b) (c d))` from `(((a b)) ((c d)))`?
The syntax needs some single extra group separator construct to express the double opening parenthesis.
SRFI 49 uses the keyword `group` for this, so (as far as I understand it) you'd have

    a b
    c d

and then

    group
      a b
    group
      c d

After poking around a bit, I didn't find the direct mapping to S-expressions as quite the right fit.
Instead, I was looking for something that has the outline types as its initial building block.

At this point, the idea was starting to become a bit clearer.
Everything starts with an *outline* that's a list of *items*.
Items are either single *lines* or *sections* that consist of a *headline* and a *body*.
Strings in general can be called *words* if they are nonempty but contain no whitespace,
*lines* if they contain no newlines
and *paragraphs* otherwise.
(Empty strings aren't called anything, you can't really express them in this system.)

There are now three ways to present a sequence.
A sequence consisting of only of words can be displayed as a single line.
A sequence consisting of words or lines can be displayed as a block of uniformly indented lines.
A sequence consisting of paragraphs can be displayed as a list of sections.
Paragraphs probably aren't section-shaped, so now we're going to need a similar group separator as SRFI 49 had.
Let's introduce double hyphen (`--`) as a dummy headline and make the actual paragraph be its body.
This is now our group separator symbol.
We'll call sections that have a `--` headline *blocks*.
The double hyphen is also the comment prefix just so I can say I have syntactically significant comments.

    -- Sequence of words on a single line
    one two three

    -- Sequence of lines
    --
      twenty one
      twenty two
      twenty three

    -- Sequence of sections
    ’Twas brillig, and the slithy toves
      Did gyre and gimble in the wabe:
    All mimsy were the borogoves,
      And the mome raths outgrabe.

    -- Sequence of non-section paragraphs with group separators
    --
      CARD
      AREA
      REAR
      DART
    --
      SATOR
      AREPO
      TENET
      OPERA
      ROTAS

## Implicit data with Serde

So now I have something a little like S-expressions, where can I go from here?
I'm writing programs with Rust, where you usually have a [Serde](https://serde.rs/) serializer library that can convert between program data and a data format.
An important thing with Serde is that you are always deserializing into a known type.
I figured I could cut some corners on syntax by exploiting knowledge of the expected type when parsing the input.
At any point, the parser knows two things: What kind of type it expects to read next and what shape of an outline fragment it is looking at.
If it's expecting a structured type like a vector or a struct, it will try treating the outline fragment as a sequence expression.
If it's expecting an atomic type like a number or a string, it will read in the outline fragment as a single string and try to convert it into the type.

Since the deserializer knows what type it expects, the format doesn't need syntax to help it along.
You can write both the list `["a", "b", "c"]` and the string `"a b c"` as just `a b c`, and it will get parsed correctly according to the expected type.
As long as you don't need to handle strings that are empty or made of only whitespace, there's no need to have any sort of string quotation syntax.
Any nonempty, not-only-whitespace string is either a word, a line or a paragraph, and all of those can be delimited with just the whitespace and the group separator.

## The outline type

The initial idea was to read the outline notes into an outline type, and then somehow pick fragments of that and use the Serde type deserializer on them.
At some point I got thinking.
The outline itself seems to have a pretty straightforward recursive type, something like this:

    struct Outline(Vec<(String, Outline)>);

("An *outline* is a sequence of sections, each of which consists of a *headline* string and an indented *body* outline.")

So could I skip having extra machinery for reading in the entire outline and use my Serde library for that as well, given a well-picked type for a whole outline?

Looking at the proposed outline type, the headline string is the only concrete value there, everything else is structural recursion.
A regular string type doesn't quite cut it here though, the headlines are special.
First of all, they have to be *lines*.
The headline string must never contain newlines.
It also mustn't be followed by the body on the same line, even if the headline is just a single word, and the body is another single word.
Second, I want the outline type to be able to consume and print entire outline files verbatim.
This means reading in comments and blank lines as well as content.

Serde is quite rigid about doing anything weird like introducing a second "must be a line, also grabs comments" string type, you get the Rust type model, and that's it, so this was the point where I decided to start doing stupid things to make the cool idea work.
I hacked up a "raw mode" that's arbitrarily marked with the otherwise mostly useless singleton tuple type `(A,)`.
Pairs also get special treatment in parsing.
Sequences like vectors must be serialized uniformly, either as horizontal lines or vertical blocks, but pairs can be serialized as sections where the first value is the headline and the second value is the body.
If the pair's first element is in raw mode, the pair *must* be a section.

Pair `("a", "b")` can be serialized as `a b`, but pair `(("a",), "b")` must become

    a
      b

Now we've got the new version of the outline declaration:

    struct Outline(Vec<((String,), Outline)>);

The singleton tuple on the headline string declares raw mode, I do some very hairy work on the Serde code to support the two parsing paths for raw vs non-raw input, and everything is go.
The serialization type system can now eat entire outline note files and preserve all their structure and content.

## Metadata in the outlines

Okay, this is neat and all, but how do you get from the full outline parsing type into a convention for metadata?
First question is, what should the metadata look like in notes anyway.
A whole sub-outline seems like the obvious unit to attach it to, so maybe it should be some sort of header region?

    Note headline
      --
        note: This part is the metadata
        date: 2020-01-02
        tags: notetaking syntax
      This is the
      Note body

That's a bit awkward with the leading `--`, but looks okay, syntax is pretty minimal.
I could maybe make it even more minimal, do I really need the colons after the attribute names?
Attribute sets look like I could parse them with my existing machinery and a type like `Vec<(String, String)>` (no raw mode this time), but that would not support the colon in the middle.

In another fit of weirdness, I started thinking of Clojure's `:keyword` syntax with a colon before the name, much easier to parse since the colon precedes the entire pair rather than showing up in the middle of it, and the awkward initial indentation of the metadata block.
The end result was the second bit of dedicated IDM syntax that makes it look like struct attributes have Clojure-like keyword syntax while actually having nothing to do with attributes.
The actual colon-syntax rule in IDM is that a group of consecutive section headlines starting with colons at the start of an outline is treated as an indented sub-outline with an empty headline.

So we start with the initial idea minus the colons:

    Note headline
      --
        note This part is the metadata
        date 2020-01-02
        tags notetaking syntax
      This is the
      Note body

And apply the colon block syntactic sugar to get:

    Note headline
      :note This part is the metadata
      :date 2020-01-02
      :tags notetaking syntax
      This is the
      Note body

This is what metadata looks like then.
You can now write code to walk your outline type, look for outlines where the first item is a headline-less block, and, well, what do you do with them anyway?
Since the expected type dictates what we get when we parse the input, parsing the same input into different types can get us different interpretations of it.
The metadata can be parsed by printing out the outline block containing it and reading it back in into a different type.
Reading into `Vec<(String, String)>` is pretty much a catch-all for single-word attributes and the values after them.
Reading into `HashMap<String, String>` is mostly the same, except duplicate attributes are no longer allowed (they probably shouldn't be).
If you have a very good idea what you're expecting, you can read into a struct with the expected attribute names as fields and more specific types as values.

The map-of-strings is a good middle of the road option, and Serde knows about map types specifically, so IDM has another use of the raw type for this.
If you have a map type inside the raw mode singleton tuple as the first element of a tuple, the whole tuple will be parsed as an outline with optional metadata.
Now we can write the final form of the outline type:

    struct AnnotatedOutline(
        (IndexMap<String, String>,),
        Vec<((String,), AnnotatedOutline)>);

The initial part reads in the metadata header as a map, and ends up with an empty map if the outline has no metadata.
The second part is the familiar plain outline inner type again, except now it recurses into another annotated outline instead.

And that's it, now you can write neat structured data, embed it in your outline notes and read it back, at least if you write your note-parsing tool in Rust.
Check out the [Implicit Data Markup](https://github.com/rsaarelm/idm) project over at GitHub for more details.
