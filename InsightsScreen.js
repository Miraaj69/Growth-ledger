// InsightsScreen.js — Premium Redesign v12
// Design: Data-forward, clean hierarchy, meaningful color usage only

import React, { useMemo, memo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp }   from './AppContext';
import { useTheme } from './ThemeContext';
import {
  fmt, fmtPct, safePct, deriveState, calcScore,
  buildInsights, MONTHS_SHORT,
} from './helpers';
import { SPACING as SP } from './theme';
import { Card, GCard, Chip, Bar, SH, Empty, AlertRow, StatRow } from './UI';
import { ScoreRing, BarChart } from './Charts';

const R_val = { md: 12, xl: 20 };

// ── Category Row ──────────────────────────────────────────
const CatRow = memo(({ exp, totalIncome }) => {
  const { T } = useTheme();
  const amt    = Number(exp?.amount) || 0;
  const pctVal = safePct(amt, totalIncome);
  const isOver = totalIncome > 0 && pctVal > 30;
  return (
    <View style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: T.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: (exp?.color || '#4F8CFF') + '18',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 16 }}>{exp?.icon || '💳'}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: T.t1 }}>{exp?.cat || 'Unknown'}</Text>
            {isOver && <Text style={{ fontSize: 9, color: '#EF4444', marginTop: 1, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>HIGH SPENDING</Text>}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: isOver ? '#EF4444' : exp?.color || T.t1 }}>{fmt(amt)}</Text>
          <Text style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{pctVal}% of income</Text>
        </View>
      </View>
      <Bar value={amt} total={Math.max(totalIncome, 1)} color={isOver ? '#EF4444' : exp?.color || '#4F8CFF'} h={4} />
    </View>
  );
});

// ── Transaction Row ───────────────────────────────────────
const TxnRow = memo(({ txn, last }) => {
  const { T } = useTheme();
  const isIncome = txn?.type === 'income';
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 }, !last && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
      <View style={{
        width: 38, height: 38, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: isIncome ? '#22C55E15' : T.l2,
      }}>
        <Text style={{ fontSize: 16 }}>{txn?.icon || (isIncome ? '💰' : '💳')}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 13, color: T.t1 }} numberOfLines={1}>
          {txn?.desc || 'Transaction'}
        </Text>
        <Text style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{txn?.date || ''}</Text>
      </View>
      <Text style={{ fontWeight: '800', fontSize: 14, color: isIncome ? '#22C55E' : T.t1 }}>
        {isIncome ? '+' : '-'}{fmt(txn?.amount || 0)}
      </Text>
    </View>
  );
});

// ── Summary Metric Card ───────────────────────────────────
const MetricCard = memo(({ icon, label, val, color }) => {
  const { T } = useTheme();
  return (
    <View style={[ist.metricCard, { backgroundColor: T.l2, borderColor: T.border }]}>
      <View style={[ist.metricIcon, { backgroundColor: color + '18' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[ist.metricVal, { color }]}>{val}</Text>
      <Text style={[ist.metricLabel, { color: T.t3 }]}>{label}</Text>
    </View>
  );
});

const ist = StyleSheet.create({
  metricCard: {
    flex: 1, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  metricIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  metricVal:   { fontSize: 15, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  metricLabel: { fontSize: 9, fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
});

// ══════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════
export default function InsightsScreen() {
  const { state: s } = useApp();
  const { T }        = useTheme();

  const d = useMemo(() => {
    try { return deriveState(s); }
    catch { return { totalIncome: 0, sipTotal: 0, debtTotal: 0, manualTotal: 0, balance: 0, savePct: 0, netWorth: 0, totalAssets: 0, debtEmi: 0 }; }
  }, [s]);

  const score = useMemo(() => {
    try { return calcScore(s); }
    catch { return { total: 0, color: '#EF4444', label: 'No data', breakdown: [] }; }
  }, [s]);

  const insights = useMemo(() => {
    try { return buildInsights(s); }
    catch { return [{ icon: '💡', msg: 'Add your data to see insights', color: '#4F8CFF' }]; }
  }, [s]);

  const bars = useMemo(() => {
    try {
      return (s.monthlyData || [])
        .slice(0, (s.currentMonth || 0) + 1)
        .map((v, i) => ({ v: Number(v) || 0, l: MONTHS_SHORT[i] || '' }))
        .slice(-6);
    } catch { return []; }
  }, [s.monthlyData, s.currentMonth]);

  const sbars = useMemo(() => {
    try {
      return (s.spendData || [])
        .slice(0, (s.currentMonth || 0) + 1)
        .map((v, i) => ({ v: Number(v) || 0, l: MONTHS_SHORT[i] || '' }))
        .slice(-6);
    } catch { return []; }
  }, [s.spendData, s.currentMonth]);

  const manualExpenses = useMemo(() => s.manualExpenses || [], [s.manualExpenses]);
  const transactions   = useMemo(() => s.transactions   || [], [s.transactions]);
  const leaves         = useMemo(() => s.leaves         || [], [s.leaves]);
  const assets         = useMemo(() => s.assets         || [], [s.assets]);
  const debts          = useMemo(() => s.debts          || [], [s.debts]);

  const catData = useMemo(() => {
    try {
      if (!manualExpenses.length || d.totalIncome === 0) return [];
      return [...manualExpenses].sort((a, b) => (Number(b?.amount) || 0) - (Number(a?.amount) || 0));
    } catch { return []; }
  }, [manualExpenses, d.totalIncome]);

  const overspendCats = useMemo(() => {
    try {
      return manualExpenses.filter(e => {
        const amt = Number(e?.amount) || 0;
        return d.totalIncome > 0 && safePct(amt, d.totalIncome) > 25;
      });
    } catch { return []; }
  }, [manualExpenses, d.totalIncome]);

  const savingsRate = fmtPct(d.savePct);
  const savingsColor = d.savePct >= 20 ? '#22C55E' : d.savePct >= 10 ? '#F59E0B' : '#EF4444';
  const ytd = (s.monthlyData || [])
    .slice(0, (s.currentMonth || 0) + 1)
    .reduce((a, v) => a + (Number(v) || 0), 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── HEADER ── */}
      <View style={{ paddingTop: 56, paddingHorizontal: SP.md, paddingBottom: SP.md }}>
        <Text style={{ fontSize: 27, fontWeight: '800', color: T.t1, letterSpacing: -0.5 }}>Insights</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>Analytics · Risk · Patterns</Text>
      </View>

      {/* ── SUMMARY METRICS ── */}
      <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: SP.md, marginBottom: 12 }}>
        <MetricCard icon="💰" label="Income"      val={fmt(d.totalIncome)}                  color="#22C55E" />
        <MetricCard icon="💸" label="Spent"       val={fmt(d.manualTotal + (d.debtEmi||0))} color="#EF4444" />
        <MetricCard icon="📊" label="Savings Rate" val={savingsRate}                         color={savingsColor} />
      </View>

      {/* ── HEALTH SCORE ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Financial Health Score" />
          {d.totalIncome === 0 ? (
            <Empty
              icon="📊"
              title="No data yet"
              sub="Enter your salary in the Money tab to see your financial health score."
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <ScoreRing score={score.total} color={score.color} size={110} sw={10} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: score.color, marginBottom: 12 }}>
                  {score.label}
                </Text>
                {(score.breakdown || []).map((b, i) => (
                  <View key={b.label || i} style={{ marginBottom: 9 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, color: T.t2, fontWeight: '500' }}>{b.label}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: b.color }}>{b.score}/{b.max}</Text>
                    </View>
                    <Bar value={b.score} total={b.max} color={b.color} h={4} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
      </View>

      {/* ── SMART INSIGHTS ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="🧠 Smart Insights" />
          {insights.map((ins, i) => (
            <AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i === insights.length - 1} />
          ))}
        </Card>
      </View>

      {/* ── OVERSPEND ALERT ── */}
      {overspendCats.length > 0 && (
        <View style={{ marginHorizontal: SP.md }}>
          <GCard colors={['#1f0a0a', '#3d0a0a']} style={{ marginBottom: 12 }}>
            <SH title="⚠️ Overspending Alert" rightColor="#EF4444" />
            {overspendCats.map((e, i) => (
              <View key={i} style={ist.overspendRow}>
                <Text style={{ fontSize: 16 }}>{e.icon || '💳'}</Text>
                <Text style={{ color: '#EF4444', fontSize: 12, lineHeight: 18, flex: 1 }}>
                  <Text style={{ fontWeight: '700' }}>{e.cat}</Text>
                  {` ${fmt(e.amount)} = ${safePct(e.amount, d.totalIncome)}% of income. Reduce to below 25%.`}
                </Text>
              </View>
            ))}
          </GCard>
        </View>
      )}

      {/* ── HIGH RATE DEBT RISK ── */}
      {debts.some(d_ => Number(d_?.rate || 0) >= 24) && (
        <View style={{ marginHorizontal: SP.md }}>
          <Card style={{ marginBottom: 12, borderColor: '#EF444430', borderWidth: 1 }}>
            <SH title="🔥 High-Rate Debt Risk" rightColor="#EF4444" />
            {debts.filter(d_ => Number(d_?.rate || 0) >= 24).map((dbt, i) => (
              <AlertRow key={i} icon="🔥" msg={`${dbt.name || 'Loan'} at ${dbt.rate}% — this rate eats your wealth. Pay ₹2K extra/mo.`} color="#EF4444" last={i === debts.length - 1} />
            ))}
          </Card>
        </View>
      )}

      {/* ── EARNINGS TREND ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <SH title="Earnings Trend" />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '800', fontSize: 18, color: '#22C55E', letterSpacing: -0.5 }}>
                {fmt(ytd)}
              </Text>
              <Text style={{ fontSize: 10, color: T.t3, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>YTD</Text>
            </View>
          </View>
          {bars.every(b => b.v === 0) ? (
            <Empty icon="📈" title="No earnings data" sub="Your salary data will appear here month by month." />
          ) : (
            <BarChart data={bars} color="#4F8CFF" height={64} />
          )}
        </Card>
      </View>

      {/* ── SPENDING TREND ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Spending Trend" />
          {sbars.every(b => b.v === 0) ? (
            <Empty icon="📉" title="No spending data" sub="Add expenses to see spending trends." />
          ) : (
            <>
              <BarChart data={sbars} color="#F59E0B" height={56} />
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: T.t3 }}>% of income spent</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>
                    {safePct(d.manualTotal, d.totalIncome)}%
                  </Text>
                </View>
                <Bar value={d.manualTotal} total={Math.max(d.totalIncome, 1)} color="#EF4444" h={5} />
              </View>
            </>
          )}
        </Card>
      </View>

      {/* ── RECENT TRANSACTIONS ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH
            title="Recent Transactions"
            right={transactions.length > 0 ? `${transactions.length} total` : undefined}
          />
          {transactions.length === 0 ? (
            <Empty icon="📋" title="No transactions yet" sub="Add expenses in the Money tab." />
          ) : (
            transactions.slice(0, 5).map((txn, i) => (
              <TxnRow key={txn?.id || i} txn={txn} last={i === Math.min(4, transactions.length - 1)} />
            ))
          )}
        </Card>
      </View>

      {/* ── CATEGORY BREAKDOWN ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Spending by Category" />
          {catData.length === 0 ? (
            <Empty icon="💳" title="No expenses added" sub="Add your monthly expenses to see category breakdown." />
          ) : (
            catData.map((exp, i) => (
              <CatRow key={exp?.id || i} exp={exp} totalIncome={d.totalIncome} />
            ))
          )}
        </Card>
      </View>

      {/* ── LEAVE BALANCE ── */}
      {leaves.length > 0 && leaves.some(l => l.total > 0) && (
        <View style={{ marginHorizontal: SP.md }}>
          <Card style={{ marginBottom: 12 }}>
            <SH title="Leave Balance" />
            {leaves.map((l, i) => {
              const left = (l.total || 0) - (l.used || 0);
              return (
                <View key={l.type || i} style={{ paddingVertical: SP.md, borderBottomWidth: i < leaves.length - 1 ? 1 : 0, borderBottomColor: T.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: T.t2, fontSize: 13, fontWeight: '500' }}>{l.label} ({l.type})</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: T.t1 }}>
                        {left}{' '}
                        <Text style={{ fontWeight: '400', color: T.t3 }}>/ {l.total} left</Text>
                      </Text>
                      {left === 0 && (
                        <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 1, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 }}>Exhausted</Text>
                      )}
                    </View>
                  </View>
                  <Bar value={left} total={Math.max(l.total, 1)} color={left <= 1 ? '#EF4444' : '#22C55E'} h={5} />
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {/* ── NET WORTH ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Net Worth" />
          <View style={{ flexDirection: 'row', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
            <Chip label={`Assets: ${fmt(d.totalAssets)}`} color="#22C55E" />
            <Chip label={`Debts: ${fmt(d.debtTotal)}`}    color="#EF4444" />
          </View>
          {assets.length === 0 ? (
            <Empty icon="🏦" title="No assets added" sub="Add your savings and investments in the Money tab." />
          ) : (
            assets.map((a, i) => (
              <StatRow key={a?.id || i} label={a?.label || 'Asset'} value={fmt(a?.value || 0)} color="#22C55E" last={i === assets.length - 1} />
            ))
          )}
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>Net Worth</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: d.netWorth >= 0 ? '#22C55E' : '#EF4444', letterSpacing: -0.5 }}>
              {fmt(Math.abs(d.netWorth))}
            </Text>
          </View>
        </Card>
      </View>

    </ScrollView>
  );
}

// Isolated styles
const overspendRowStyle = {
  backgroundColor: '#EF444410',
  borderRadius: 11,
  padding: 10,
  marginBottom: 7,
  borderWidth: 1,
  borderColor: '#EF444428',
  flexDirection: 'row',
  gap: 9,
  alignItems: 'flex-start',
};

// Extend ist with overspend row
ist.overspendRow = overspendRowStyle;
