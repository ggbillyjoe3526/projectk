"""Character specs for the v2 concept shots: CAST = {id: (spec, voxel)}.

Poses are joint rotations (x, y, z) in radians, three.js 'YXZ' order. Arms hang along -y:
x < 0 swings an arm forward/up; on the left arm z > 0 swings it out to the side (mirror on the right).
"""
HERO = 0.0055
NPC = 0.0065
CROWD = 0.0085


def william(pose, **kw):
    s = dict(scale=1.0, build=1.04, coat='long', top='shirt', tie=True, v=0.2, pose=pose, width=0.98, jaw=0.97, stubble=0.55)
    s.update(kw)
    return s


CAST = {
    # --- William Sloan ---
    'w_ferry': (william({'spine': (0.12, 0, 0), 'chest': (0.05, 0, 0), 'neck': (0.0, 0.15, 0), 'head': (-0.05, 0.2, 0),
                         'lSh': (-0.75, 0, 0.3), 'lEl': (-0.55, 0, 0), 'rSh': (-0.75, 0, -0.3), 'rEl': (-0.55, 0, 0),
                         'lHip': (0.05, 0, 0.04), 'rHip': (-0.08, 0, -0.04), 'rKnee': (0.1, 0, 0)}, tie=False, v=0.16), HERO),
    'w_vigil': (william({'spine': (0.5, 0.12, 0), 'chest': (0.1, 0.0, 0), 'neck': (0.15, 0.15, 0), 'head': (0.25, 0.3, 0),
                         'lHip': (-1.5, 0, 0.12), 'lKnee': (1.45, 0, 0), 'rHip': (-1.5, 0, -0.12), 'rKnee': (1.45, 0, 0),
                         'lSh': (-0.6, 0, 0.12), 'lEl': (-1.6, 0, 0), 'rSh': (-0.6, 0, -0.12), 'rEl': (-1.7, 0, 0)},
                        hipsY=0.5), HERO),
    'w_note': (william({'chest': (0.05, 0, 0), 'neck': (0.3, 0, 0), 'head': (0.4, 0, 0),
                        'lSh': (-0.7, 0, 0.12), 'lEl': (-1.1, 0, 0), 'rSh': (-0.7, 0, -0.12), 'rEl': (-1.15, 0, 0)}), HERO),
    'w_kirk': (william({'spine': (-0.1, 0, 0), 'head': (-0.05, 0.15, 0), 'lSh': (-0.35, 0, 0.35), 'lEl': (-0.4, 0, 0),
                        'rSh': (-0.3, 0, -0.35), 'rEl': (-0.5, 0, 0), 'lHip': (0.25, 0, 0), 'rHip': (-0.3, 0, 0), 'rKnee': (0.2, 0, 0)}), HERO),
    'w_dialogue': (william({'head': (0.08, -0.12, 0), 'lSh': (0.05, 0, 0.08), 'lEl': (-0.25, 0, 0), 'rSh': (-0.05, 0, -0.08),
                            'rEl': (-0.3, 0, 0), 'lHip': (0.03, 0, 0.03), 'rHip': (-0.05, 0, -0.03)}), HERO),
    'w_combat': (william({'hips': (0, 0.2, 0), 'spine': (0.15, 0.25, 0), 'head': (0.05, -0.25, 0),
                          'lHip': (-0.5, 0, 0.12), 'lKnee': (0.65, 0, 0), 'rHip': (0.35, 0, -0.1), 'rKnee': (0.3, 0, 0),
                          'rSh': (-1.9, 0.3, -0.35), 'rEl': (-0.7, 0, 0), 'lSh': (-1.1, -0.3, 0.2), 'lEl': (-0.25, 0, 0)},
                         hipsY=0.9, rGrip=True, lGrip=True), HERO),
    # --- the living ---
    'morag': (dict(scale=0.94, build=0.92, coat='long', top='knit_cream', hair='scarf', belly=1.05, closed=True, fem=1, width=0.93, jaw=0.84, nose=0.85, look=(-0.25, 0.05, 1),
                   pose={'spine': (0.1, 0, 0), 'chest': (0.08, 0, 0), 'head': (-0.05, 0.12, 0), 'lSh': (-0.15, 0, 0.1), 'lEl': (-0.45, 0, 0),
                         'rSh': (-0.12, 0.0, -0.1), 'rEl': (-0.3, 0, 0)}, rGrip=True), NPC),
    'listener': (dict(scale=1.0, build=1.05, coat='short', top='knit_cream', hat='cap', closed=True, width=1.04, jaw=1.08, stubble=0.7,
                      pose={'spine': (0.35, 0, 0), 'neck': (0.3, 0, 0), 'head': (0.45, 0, 0.2), 'lSh': (0, 0, 0.1), 'rSh': (0, 0, -0.1)}), CROWD),
    'crew': (dict(scale=0.95, build=0.9, coat='short', top='wool_navy', hair='long', vest=True, closed=True, fem=1, width=0.92, jaw=0.84, nose=0.85,
                  pose={'head': (0.05, -0.1, 0), 'lSh': (0, 0, 0.1), 'rSh': (-0.2, 0, -0.1), 'rEl': (-1.2, 0, 0)}), NPC),
    # --- the Unburied ---
    'fisher': (dict(scale=1.04, build=1.12, coat='long', top='knit_cream', hat='souwester', boots=True, closed=True, legs='oilskin', width=1.06, jaw=1.12, stubble=0.8, browCol=(0.6, 0.6, 0.6),
                    pose={'spine': (0.35, 0, 0.1), 'neck': (-0.1, 0, 0), 'head': (-0.25, 0, 0.35),
                          'lHip': (-0.6, 0, 0), 'lKnee': (0.5, 0, 0), 'rHip': (0.4, 0, 0), 'rKnee': (0.4, 0, 0),
                          'rSh': (-2.7, 0, -0.2), 'rEl': (-0.5, 0, 0), 'lSh': (-0.9, 0, 0.3), 'lEl': (-0.4, 0, 0)},
                    hipsY=0.88, rGrip=True), NPC),
    'hivis': (dict(scale=1.0, build=1.08, coat='none', top='knit_cream', vest=True, hair='bald', boots=True, belly=1.12, width=1.05, jaw=1.1, stubble=0.6, browCol=(0.6, 0.6, 0.6),
                   pose={'spine': (0.25, 0, -0.15), 'head': (0.4, 0, -0.5), 'lSh': (-0.3, 0, 0.1), 'lEl': (-0.2, 0, 0),
                         'rSh': (-0.7, 0, -0.1), 'rEl': (-0.6, 0, 0), 'lHip': (-0.4, 0, 0), 'lKnee': (0.5, 0, 0), 'rHip': (0.2, 0, 0)}), NPC),
    'kneel': (dict(scale=0.95, build=0.92, coat='long', top='shirt', hair='long', closed=True, fem=1, width=0.93, jaw=0.88, nose=0.9,
                   pose={'spine': (0.6, 0, 0), 'head': (0.6, 0, 0), 'lHip': (-1.4, 0, 0), 'lKnee': (2.6, 0, 0),
                         'rHip': (-0.2, 0, 0), 'rKnee': (2.4, 0, 0), 'lSh': (0.1, 0, 0.2), 'rSh': (0.1, 0, -0.2)}, hipsY=0.45), NPC),
    'watcher': (dict(scale=0.93, build=0.88, coat='long', top='shirt', hair='long', closed=True, fem=1, width=0.92, jaw=0.85, nose=0.85, pose={'head': (0.0, 0, 0.4)}), CROWD),
    # --- kirk ---
    'minister': (dict(scale=1.0, build=1.0, coat='gown', top='wool_black', dogcollar=True, hair='bald', closed=True,
                      pose={'head': (0.1, 0, 0.75), 'lSh': (-0.6, 0, 0.3), 'lEl': (-0.6, 0, 0), 'rSh': (-0.6, 0, -0.3), 'rEl': (-0.6, 0, 0)}), CROWD),
    'reach': (dict(scale=1.02, build=1.05, coat='long', top='wool_black', closed=True,
                   pose={'spine': (0.2, 0, 0), 'head': (-0.1, 0, 0.4), 'rSh': (-1.4, 0, -0.1), 'rEl': (-0.1, 0, 0), 'lSh': (-0.9, 0, 0.1),
                         'lEl': (-0.3, 0, 0), 'lHip': (-0.4, 0, 0), 'lKnee': (0.4, 0, 0), 'rHip': (0.3, 0, 0)}), CROWD),
    'alan': (dict(scale=0.98, build=0.95, coat='none', top='shirt', shroud=True, hair='bald', shut=True, pose={'lSh': (0, 0, 0.05), 'rSh': (0, 0, -0.05)}), NPC),
}

# the congregation: a handful of bodies, reused with different clothes and heads
for i, (hair, hat, coat, top, tie, sc, b, head, sp) in enumerate([
    ('scarf', None, 'long', 'knit_cream', False, 0.93, 0.92, (0.1, 0.0, 0.2), 0.05),
    ('short', None, 'long', 'shirt', True, 1.02, 1.08, (0.05, 0.0, -0.1), 0.0),
    ('bald', None, 'short', 'knit_cream', False, 0.98, 1.15, (0.15, 0.0, 0.5), 0.12),
    ('short', 'cap', 'short', 'shirt', False, 1.0, 1.0, (0.05, 0.0, 0.05), 0.08),
    ('long', None, 'long', 'shirt', False, 0.94, 0.9, (0.12, 0.0, -0.3), 0.05),
    ('short', None, 'long', 'shirt', True, 1.05, 1.1, (0.2, 0.0, 0.9), 0.15),
]):
    fem = i in (0, 4)
    CAST[f'cong{i}'] = (dict(scale=sc, build=b, coat=coat, top=top, tie=tie, hair=hair, hat=hat, closed=not tie,
                             fem=int(fem), width=0.92 if fem else 0.98 + i * 0.02, jaw=0.85 if fem else 0.95 + i * 0.04,
                             pose={'spine': (sp, 0, 0), 'head': head, 'lSh': (-0.05, 0, 0.06), 'rSh': (-0.05, 0, -0.06)}), CROWD)
