export default function SafetyGuidelines() {
  const sections = [
    {
      title: 'Meet in safe, public places',
      points: [
        'Always use one of the pre-approved meetup points (school gates, libraries, police station frontages) shown when a request is accepted.',
        'Meet during daylight hours whenever possible.',
        'Bring a friend or family member along, especially for evening meetups.',
      ],
    },
    {
      title: 'Verify before you meet',
      points: [
        'Check the other person\'s verification badge and rating before accepting or sending a request.',
        'Contact details and exact location are only shared after a request is mutually accepted — never share these earlier.',
        'If something feels off, decline the request. You are never obligated to proceed.',
      ],
    },
    {
      title: 'Inspect the item first',
      points: [
        'Examine the book/item for condition before handing over any money.',
        'For paid listings, only pay the agreed price shown on the listing — never more.',
        'ShareShelf does not process payments; all payment is handled directly between users, in person.',
      ],
    },
    {
      title: 'For students and guardians',
      points: [
        'Students under 18 should have a parent/guardian aware of and, ideally, present at any meetup.',
        'Guardian contact information can be added to a student profile for schools/parents who want an extra layer of oversight.',
      ],
    },
    {
      title: 'If something goes wrong',
      points: [
        'Use the "Report" button on any listing or profile to flag suspicious behavior — our admin team reviews every report.',
        'Use "Report no-show" on a transaction if the other party doesn\'t show up at the agreed meetup.',
        'In an emergency, contact local authorities first — ShareShelf is a discovery layer, not an emergency service.',
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-4xl font-semibold mb-3">Safety guidelines</h1>
      <p className="text-muted mb-10">
        ShareShelf connects people directly — we don't handle payment, delivery, or verify the physical condition of
        items. These guidelines help keep every meetup safe.
      </p>

      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-display text-xl font-semibold mb-3">{s.title}</h2>
            <ul className="space-y-2">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2 text-ink/80">
                  <span className="text-forest">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
