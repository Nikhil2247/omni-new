import { BrushBar, Ico, Stamp, Chip } from '@/components/sketch'
import type { ToolKey } from '@/components/home/content'

/** Static previews of each planning tool, shown in the home showcase and on each tool's page. Figures are examples. */
export function ToolPreview({ tool }: { tool: ToolKey }) {
  const h4 = 'sk-eyebrow mb-3.5 block'
  if (tool === 'budget') {
    const rows: Array<[string, string, number]> = [
      ['Venue', '8,00,000', 32],
      ['Catering', '4,50,000', 18],
      ['Photography', '2,00,000', 8],
      ['Decor', '1,75,000', 7],
    ]
    return (
      <div>
        <span className={h4}>Total Budget</span>
        <div className="font-display text-[2.2rem] leading-none font-bold">₹25,00,000</div>
        {rows.map(([label, amount, pct]) => (
          <div key={label} className="mt-3.5 grid grid-cols-[110px_1fr_90px] items-center gap-3 text-[0.92rem] max-[560px]:grid-cols-[78px_1fr_72px]">
            <span>{label}</span>
            <BrushBar value={pct * 2.4} className="!mt-0" />
            <b className="text-right tabular-nums">{amount}</b>
          </div>
        ))}
      </div>
    )
  }
  if (tool === 'checklist') {
    const tasks: Array<[string, boolean]> = [
      ['Book venue and photographer', true],
      ['Send save-the-date messages', true],
      ['Menu tasting', false],
      ['Confirm every vendor', false],
    ]
    return (
      <div>
        <span className={h4}>Planning Progress</span>
        <div className="font-display text-[2.2rem] leading-none font-bold">64%</div>
        <BrushBar value={64} tone="green" className="mb-4" />
        <ul className="grid gap-2.5">
          {tasks.map(([t, done]) => (
            <li key={t} className="flex items-center gap-2.5 text-[0.95rem]">
              <input type="checkbox" className="sk-check" checked={done} readOnly aria-label={t} />
              <span className={done ? 'text-ink-soft line-through decoration-blue-wash decoration-[3px]' : ''}>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (tool === 'timeline') {
    const items: Array<[string, string, string]> = [
      ['4:00 PM', 'Baraat arrives', "groom's side"],
      ['5:30 PM', 'Jaimala', 'photographer'],
      ['7:00 PM', 'Pheras', 'family'],
      ['9:30 PM', 'Dinner', 'caterer'],
    ]
    return (
      <div>
        <span className={h4}>Wedding day</span>
        <ol className="relative mt-2 grid gap-3 pl-[26px] before:absolute before:top-1.5 before:bottom-1.5 before:left-[7px] before:border-l-[3px] before:border-dotted before:border-ink-soft">
          {items.map(([time, what, who]) => (
            <li key={time} className="relative before:absolute before:top-[5px] before:-left-[25px] before:size-[13px] before:rounded-[50%_46%_52%_48%] before:bg-blue">
              <b className="block">{time}</b>
              {what} <span className="text-ink-soft text-sm">· {who}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }
  if (tool === 'guests') {
    return (
      <div>
        <span className={h4}>Guest list</span>
        <div className="font-display text-[2.2rem] leading-none font-bold">
          120 <small className="text-ink-soft font-sans text-base font-normal">invited</small>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <Stamp>84 confirmed</Stamp>
          <Stamp tone="wait">27 pending</Stamp>
          <Stamp tone="late">9 declined</Stamp>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip>Family 48</Chip>
          <Chip>Friends 40</Chip>
          <Chip>Colleagues 22</Chip>
          <Chip>Others 10</Chip>
        </div>
      </div>
    )
  }
  if (tool === 'rsvp') {
    const rows: Array<[string, number, 'blue' | 'green' | 'gold']> = [
      ['Confirmed', 70, 'green'],
      ['Pending', 23, 'gold'],
      ['Declined', 7, 'blue'],
    ]
    return (
      <div>
        <div className="grid place-items-center gap-1.5 text-center">
          <Ico d='<rect x="5" y="10" width="38" height="28" rx="3"/><path d="M5 14l19 14 19-14"/>' className="!size-[70px]" />
          <b className="font-display text-xl">Replies this week</b>
        </div>
        {rows.map(([label, pct, tone]) => (
          <div key={label} className="mt-3.5 grid grid-cols-[90px_1fr_50px] items-center gap-3 text-[0.92rem]">
            <span>{label}</span>
            <BrushBar value={pct} tone={tone} className="!mt-0" />
            <b className="text-right tabular-nums">{pct}%</b>
          </div>
        ))}
        <p className="sk-hand mt-3.5 text-lg">Reminder scheduled for pending guests</p>
      </div>
    )
  }
  return (
    <div className="sk-paper mx-auto grid aspect-[3/4] max-w-[260px] place-content-center gap-3 px-[18px] py-6 text-center">
      <small className="sk-eyebrow !text-[0.66rem]">Together with their families</small>
      <div className="font-display text-blue text-3xl leading-[1.05] font-bold italic">Aarav</div>
      <div className="sk-hand text-3xl !text-gold">&amp;</div>
      <div className="font-display text-blue text-3xl leading-[1.05] font-bold italic">Meera</div>
      <small className="sk-eyebrow !text-[0.66rem]">invite you to celebrate</small>
    </div>
  )
}
