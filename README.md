# hide_self_view Firefox Extension

## Purpose
Are you tired of *constantly* clicking around Google's UI to hide your view when in video calls?

## Background

The research on what seeing yourself in calls is profound.  It's physically draining to see yourself all day long.  It's unnatural as well (when's the last time you were staring at yourself in an in-person meeting?)

## Implementation details

This extension is a dirty, dirty hack that relies on very specific DOM structures from Google.  Google does *not* provide semantic web markup/classes to hook into in order to perform these operations cleanly.

## Build steps

```bash
$ bin/build
$ bin/sign
```