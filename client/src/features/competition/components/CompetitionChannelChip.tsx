/** Explicit channel provenance on every competitor card. Never a spend metric. */
export function CompetitionChannelChip({ channel }: { channel: 'Meta' | 'Google' }) {
  return <span className={`v2-competition-channel-chip v2-competition-channel-${channel.toLowerCase()}`}
    aria-label={`${channel} advertising activity, not spend`}>{channel} · activity</span>;
}
