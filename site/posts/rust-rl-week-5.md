:title RUST-RL does /r/roguelikedev follows the complete tutorial, week 5
:date 2024-06-12
:tags RUST-RL roguelikedev
:desc not a whole lot - busy week, so mostly just some tweaks and tidying up

## tweaks

this ended up being a really busy week for me, so hobby stuff had to take a backseat for a while. in the free time i did manage to grab, i mostly focused on things i could get finished in the time that i had, rather than anything i might end up starting and then with all likelihood not be able to get back to until the next week when things were quieter again - by which point, i'd probably have forgotten where i was

- logs from the same tick now *mostly* share a line, outside of some special circumstances. e.g. `You hit the goblin. The goblin hits you.`, as opposed to that being split over multiple lines. 
    -   this was pretty easy. previously logs were being posted each time anything happened; now a logger is created the first time a system is run each tick, messages are appended to the logger, and if the logger isn't blank by the time the system completes everything gets posted all on the same line
- the *chance to spawn a guy each turn* system works with groupsize flags now: where appropriate, there's a chance to spawn a pack of creatures each turn rather than packs only spawning on initial map generation
- and that's about it

more next week; thankfully with how much i managed to get out during the first 4 weeks, i'm still massively ahead on time even wtih mostly taking this week off. 

next week's plans are ambitious. visuals, item identification, and encumbrance.
