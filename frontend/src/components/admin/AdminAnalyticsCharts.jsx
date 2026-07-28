import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BAR_COLORS = ['#5850EC', '#329683', '#8DA2FB', '#7CD1BC', '#B4C6FC', '#4EB6A0'];

/**
 * Patients-seen-today per doctor, and a queue-load snapshot. Built from
 * data AdminDashboardContent already fetches (workload, queues) — no
 * additional network calls.
 */
export default function AdminAnalyticsCharts({ workload, queues }) {
  const workloadData = (workload || [])
    .map((w) => ({
      name: `Dr. ${w.lastName || w.firstName || ''}`.trim(),
      patients: w.patientCountToday ?? 0,
    }))
    .filter((d) => d.name !== 'Dr.')
    .slice(0, 8);

  const queueData = (queues || [])
    .map((q) => ({
      name: `Dr. ${q.doctorName?.split(' ').slice(-1)[0] || ''}`.trim(),
      waiting: q.activeCount ?? q.waitingCount ?? 0,
    }))
    .slice(0, 8);

  if (workloadData.length === 0 && queueData.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {workloadData.length > 0 && (
        <div className="glass-panel !p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100/50 bg-white/40">
            <h2 className="font-bold text-dark">Patients seen today, by doctor</h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(88,80,236,0.06)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }}
                />
                <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                  {workloadData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {queueData.length > 0 && (
        <div className="glass-panel !p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100/50 bg-white/40">
            <h2 className="font-bold text-dark">Current queue load, by doctor</h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queueData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(50,150,131,0.06)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }}
                />
                <Bar dataKey="waiting" fill="#329683" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
