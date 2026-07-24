export default function VerifiedBadge({ status, role }) {
  if (role === 'public') {
    return <span className="text-xs bg-sage text-forest-dark px-2 py-0.5 rounded-full font-medium">Public Donor</span>;
  }
  if (status === 'approved') {
    return (
      <span className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded-full font-medium">
        ✅ Verified {role === 'school' ? 'Institution' : 'Student'}
      </span>
    );
  }
  if (status === 'pending') {
    return <span className="text-xs bg-amber/10 text-amber-dark px-2 py-0.5 rounded-full font-medium">Verification pending</span>;
  }
  return <span className="text-xs bg-ink/5 text-muted px-2 py-0.5 rounded-full font-medium">Unverified</span>;
}
