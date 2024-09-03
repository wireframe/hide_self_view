# hide_self_view Firefox Extension

## Purpose
Are you tired of *constantly* clicking around Google's UI to hide your view when in video calls?  Well, so am I!  This extension will automatically hide the "self-view" when you join a Google Hangout/Meet video call.

## Background

The research on what seeing yourself in calls is profound.  It's physically draining to see yourself all day long.  It's unnatural as well (when's the last time you were staring at yourself in an in-person meeting?)

During the COVID shift to hybrid work, the themes of "Zoom burnout" and exhaustion became much more prominent along with research on the impact to well-being.  One study specifically, by Dan Zahavi and Phillippe Rochat, identified that seeing a mirror of yourself on video calls is a significant driver of mental exhaustion (and your general well-being).
[The Uncanny mirror: A re-framing of mirror self-experience](https://www.researchgate.net/publication/47299891_The_Uncanny_mirror_A_re-framing_of_mirror_self-experience)

> It's taxing on us. It's stressful. And there's lots of research showing that there are negative emotional consequences to seeing yourself in a mirror. Professor Jeremy Bailenson, founding director of the [Stanford Virtual Human Interaction Lab](https://vhil.stanford.edu/)

## Implementation details

This extension is a dirty, dirty hack that relies on very specific DOM structures from Google.  Google does *not* provide semantic web markup/classes to hook into in order to perform these operations cleanly.

## Build steps

```bash
$ bin/build
$ bin/sign
```