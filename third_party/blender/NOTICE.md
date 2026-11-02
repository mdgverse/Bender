# Blender compositor code

`src/compositor.js` contains JavaScript adaptations of the Exposure and
Brightness/Contrast compositor pixel operations from Blender, copyright Blender
Authors, licensed under GNU GPL version 2 or later (SPDX: GPL-2.0-or-later).
The Brightness/Contrast source credits Werner D. Streidt / OpenCV `demhist.c`.

Upstream revision: `a5080f6cd433a11bb2c254f20dc208f4a6ea9804`.

- https://github.com/blender/blender/blob/a5080f6cd433a11bb2c254f20dc208f4a6ea9804/source/blender/nodes/composite/nodes/node_composite_exposure.cc
- https://github.com/blender/blender/blob/a5080f6cd433a11bb2c254f20dc208f4a6ea9804/source/blender/nodes/composite/nodes/node_composite_brightness_contrast.cc

The adapted operations are implemented in JavaScript for browser execution;
the surrounding graph, image pipeline and interface are Bender code, not the
Blender compositor engine. The exact license text accompanying Blender is in
`GPL-2.0.txt`. Source is available at https://github.com/mdgverse/Bender.
