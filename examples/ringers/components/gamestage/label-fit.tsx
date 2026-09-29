'use client'

import * as React from 'react'

/**
 * Label fit: what a control does with a label too long for it. GSUI-281.
 * The settings and their defaults are in registry/items/label-fit.json.
 * A name is shortened only for an option marked a person, the accessible name
 * stays the full label, and the fit is resolved once at layout, never in play.
 */

export type LabelFit = 'wrap' | 'shrink' | 'truncate'
export type NameFormat = 'full' | 'initial' | 'surname'
export type GroupFit = 'uniform' | 'each'
export type LabelLines = 1 | 2 | 3

export interface LabelFitSettings {
  labelFit?: LabelFit
  maxLines?: LabelLines
  /**
   * Lines every label in the group is given room for, whatever it needs, so a
   * one-line name and a two-line name make controls of one height. Capped at
   * `maxLines`. Choice defaults it to `maxLines`; Button to 1.
   */
  minLines?: LabelLines
  /** The smallest the type may be set, as a fraction of its size. Never below 17px. */
  shrinkFloor?: number
  nameFormat?: NameFormat
  groupFit?: GroupFit
  /** Groups with the same id share one fit. Absent, a group fits alone. */
  fitGroup?: string
}

export type ResolvedLabelFitSettings = Required<Omit<LabelFitSettings, 'fitGroup' | 'minLines'>> & {
  fitGroup?: string
  minLines?: LabelLines
}

export const LABEL_FIT_DEFAULTS: ResolvedLabelFitSettings = {
  labelFit: 'wrap',
  maxLines: 2,
  shrinkFloor: 0.85,
  nameFormat: 'full',
  groupFit: 'uniform',
}

/** The smallest body text we set anywhere, in CSS pixels. */
export const MIN_LABEL_PX = 17

// ---------------------------------------------------------------------------
// Names

/**
 * A person's name, shortened.
 *
 * "Jonty Verhoeven" becomes "J. Verhoeven" or "Verhoeven". Everything after the
 * first word is the surname, so "Kevin De Bruyne" keeps "De Bruyne" whole. A
 * hyphenated first name keeps its hyphen: "Jean-Pierre Papin" is "J.-P. Papin".
 * A one-word name has nothing to shorten and comes back unchanged.
 */
export function shortenName(name: string, format: NameFormat): string {
  const words = name.trim().split(/\s+/)
  if (format === 'full' || words.length < 2) return name
  const surname = words.slice(1).join(' ')
  if (format === 'surname') return surname
  const initial = (words[0] ?? '')
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0)}.`)
    .join('-')
  return `${initial} ${surname}`
}

// ---------------------------------------------------------------------------
// Planning one label

/** How many lines `text` needs at `scale` in its box. Infinity when a word cannot fit at all. */
export type MeasureLines = (text: string, scale: number) => number

export interface LabelPlan {
  /** What is drawn. The accessible name is always the full label. */
  text: string
  /** The type size, as a fraction of the control's own. */
  scale: number
  /** Lines the drawn text takes, at most the setting's maximum. */
  lines: number
  /** Nothing fitted, so the drawn text ends in an ellipsis. */
  clipped: boolean
  /** Which short form of a person's name is drawn, when one is. */
  name?: 'initial' | 'surname'
}

/**
 * The scale the type may shrink to: the setting's floor, but never below 17px,
 * and never a scale above 1. A control whose type is already 17px or smaller
 * does not shrink at all.
 */
export function floorScale(basePx: number, shrinkFloor: number): number {
  if (!(basePx > 0)) return 1
  const legible = MIN_LABEL_PX / basePx
  return Math.min(1, Math.max(shrinkFloor, legible))
}

/** The sizes `shrink` tries, largest first, in steps of 5%, ending on the floor. */
function scalesDown(floor: number): number[] {
  const out: number[] = []
  for (let s = 1; s > floor + 1e-9; s = Math.round((s - 0.05) * 100) / 100) out.push(s)
  out.push(floor)
  return out
}

/**
 * The plan for one label: what to draw and at what size.
 *
 * The order is the setting's promise. For each form of the text, full first:
 *   shrink:   one line at each smaller size down to the floor, then wrap at
 *             full size up to `maxLines`;
 *   wrap:     up to `maxLines` at full size;
 *   truncate: one line at full size.
 * Only when the full name fits none of those is a person's name shortened, and
 * only when even the shortest form fails is the text clipped.
 */
export function planLabel(
  label: string,
  options: {
    person: boolean
    settings: ResolvedLabelFitSettings
    measure: MeasureLines
    floor: number
  },
): LabelPlan {
  const { person, settings, measure, floor } = options
  const maxLines = settings.labelFit === 'truncate' ? 1 : settings.maxLines

  const forms: Array<{ text: string; name?: 'initial' | 'surname' }> = []
  if (!person || settings.nameFormat === 'full') forms.push({ text: label })
  if (person) {
    const short = settings.nameFormat === 'surname' ? 'surname' : 'initial'
    const text = shortenName(label, short)
    if (text !== label) forms.push({ text, name: short })
    else if (settings.nameFormat !== 'full') forms.push({ text: label })
  }

  for (const form of forms) {
    if (settings.labelFit === 'shrink') {
      for (const scale of scalesDown(floor)) {
        if (measure(form.text, scale) <= 1) return { ...form, scale, lines: 1, clipped: false }
      }
    }
    const lines = measure(form.text, 1)
    if (lines <= maxLines) return { ...form, scale: 1, lines: Math.max(1, lines), clipped: false }
  }

  const last = forms[forms.length - 1] ?? { text: label }
  return { ...last, scale: settings.labelFit === 'shrink' ? floor : 1, lines: maxLines, clipped: true }
}

/**
 * The size and line count a group settles on.
 *
 * `uniform`: the smallest size any label needed and the most lines any label
 * took, so every label is drawn alike. `each`: nothing shared, and the group's
 * line count is only the most any one label took.
 */
export function resolveGroup(
  plans: LabelPlan[],
  groupFit: GroupFit,
  minLines = 1,
): { scale: number; lines: number } {
  if (plans.length === 0) return { scale: 1, lines: Math.max(1, minLines) }
  const lines = Math.max(1, minLines, ...plans.map((p) => p.lines))
  if (groupFit === 'each') return { scale: 1, lines }
  return { scale: Math.min(...plans.map((p) => p.scale)), lines }
}

// ---------------------------------------------------------------------------
// Settings from above: app-wide defaults, then the component's own props

const LabelFitContext = React.createContext<LabelFitSettings>({})

/**
 * App-wide label settings, the same way `StringsProvider` supplies words.
 * Defaults, then this provider, then a component's own props, in that order.
 */
export function LabelFitProvider(props: { settings: LabelFitSettings; children?: React.ReactNode }) {
  const parent = React.useContext(LabelFitContext)
  const merged = React.useMemo(() => ({ ...parent, ...props.settings }), [parent, props.settings])
  return <LabelFitContext.Provider value={merged}>{props.children}</LabelFitContext.Provider>
}

/**
 * Settings that fill gaps only: anything a provider above already set wins.
 * For a container, such as a stage on a fixed screen, whose preference is a
 * default rather than a decision. GSUI-282.
 */
export function LabelFitDefaults(props: { settings: LabelFitSettings; children?: React.ReactNode }) {
  const parent = React.useContext(LabelFitContext)
  const merged = React.useMemo(() => ({ ...props.settings, ...defined(parent) }), [parent, props.settings])
  return <LabelFitContext.Provider value={merged}>{props.children}</LabelFitContext.Provider>
}

function defined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>
}

export function useLabelFitSettings(own: LabelFitSettings): ResolvedLabelFitSettings {
  const fromProvider = React.useContext(LabelFitContext)
  return { ...LABEL_FIT_DEFAULTS, ...defined(fromProvider), ...defined(own) }
}

// ---------------------------------------------------------------------------
// Groups that share one fit, only when asked to

type Shared = { scale: number; lines: number }
const sharedFits = new Map<string, Map<symbol, Shared>>()
const sharedListeners = new Map<string, Set<() => void>>()

function combined(id: string): Shared | undefined {
  const members = sharedFits.get(id)
  if (!members || members.size === 0) return undefined
  const all = [...members.values()]
  return { scale: Math.min(...all.map((m) => m.scale)), lines: Math.max(...all.map((m) => m.lines)) }
}

function publish(id: string, key: symbol, fit: Shared | undefined) {
  const members = sharedFits.get(id) ?? new Map<symbol, Shared>()
  if (fit) members.set(key, fit)
  else members.delete(key)
  sharedFits.set(id, members)
  sharedListeners.get(id)?.forEach((listener) => listener())
}

// ---------------------------------------------------------------------------
// Measuring, in the browser

/**
 * Builds a measure for one label element: an invisible copy with its font and
 * width, which reports how many lines a text takes at a given size.
 */
/**
 * The width a label may use. A control marks the box its label lives in with
 * the class `gs-label-box` when it does not fill it, as a button's label shares its
 * row with a padlock: then it is the box's content width less everything else
 * in the row. Otherwise it is the label's own width, which the stylesheet
 * stretches to the whole of its control.
 */
function availableWidth(label: HTMLElement): number {
  const box = label.closest<HTMLElement>('.gs-label-box')
  if (!box) return label.clientWidth
  const bs = getComputedStyle(box)
  let width = box.clientWidth - parseFloat(bs.paddingInlineStart || bs.paddingLeft) - parseFloat(bs.paddingInlineEnd || bs.paddingRight)
  const gap = parseFloat(bs.columnGap) || 0
  let inRow = 0
  for (const child of Array.from(box.children) as HTMLElement[]) {
    const cs = getComputedStyle(child)
    if (cs.position === 'absolute' || cs.display === 'none') continue
    inRow += 1
    if (child !== label && !child.contains(label)) width -= child.getBoundingClientRect().width
  }
  return width - gap * Math.max(0, inRow - 1)
}

function measurerFor(label: HTMLElement): { measure: MeasureLines; basePx: number; release: () => void } | null {
  const style = getComputedStyle(label)
  const basePx = parseFloat(style.fontSize) / (parseFloat(style.getPropertyValue('--gs-label-scale')) || 1)
  const width = availableWidth(label)
  if (!(basePx > 0) || !(width > 0)) return null
  const lineHeight = style.lineHeight === 'normal' ? basePx * 1.2 : parseFloat(style.lineHeight)
  const ratio = lineHeight / basePx

  const probe = document.createElement('span')
  const s = probe.style
  s.position = 'absolute'
  s.visibility = 'hidden'
  s.pointerEvents = 'none'
  s.insetInlineStart = '-10000px'
  s.insetBlockStart = '0'
  s.display = 'block'
  s.inlineSize = `${width}px`
  s.fontFamily = style.fontFamily
  s.fontWeight = style.fontWeight
  s.fontStyle = style.fontStyle
  s.letterSpacing = style.letterSpacing
  s.textTransform = style.textTransform
  s.whiteSpace = 'normal'
  s.overflowWrap = 'normal'
  s.wordBreak = 'normal'
  // Measured where the label lives, not on <body>. On <body> the copy sat
  // outside the theme island and set arcade's Unbounded narrower than the label
  // itself draws it on Linux: "Get my progress back" measured 281px against the
  // 297 it has, so one line was reserved, and the real text broke onto a second
  // line that the one-line clamp hid. Inside the label's own box the copy
  // inherits exactly what the text does. It is absolute and hidden, so it moves
  // nothing while it is there.
  ;(label.closest<HTMLElement>('.gs-label-box') ?? label.parentElement ?? document.body).appendChild(probe)

  const measure: MeasureLines = (text, scale) => {
    const px = basePx * scale
    s.fontSize = `${px}px`
    s.lineHeight = `${px * ratio}px`
    probe.textContent = text
    if (probe.scrollWidth > width + 0.5) return Infinity
    return Math.max(1, Math.round(probe.scrollHeight / (px * ratio)))
  }
  return { measure, basePx, release: () => probe.remove() }
}

export interface LabelFitItem {
  id: string
  label: string
  person?: boolean
}

export interface LabelFitState {
  plans: Map<string, LabelPlan>
  scale: number
  lines: number
  /** False until the group has been measured, which never happens outside a browser. */
  measured: boolean
  /** A ref callback for each label: `ref={fit.labelRef(option.id)}`. */
  labelRef: (id: string) => (el: HTMLElement | null) => void
}

/**
 * Fits every label in a group. `container` is the group, watched for a real
 * resize; each label hands itself over through `labelRef(id)`.
 */
export function useLabelFit(
  container: React.RefObject<HTMLElement | null>,
  items: LabelFitItem[],
  settings: ResolvedLabelFitSettings,
): LabelFitState {
  const initialLines = settings.labelFit === 'truncate' ? 1 : settings.maxLines
  const elements = React.useRef(new Map<string, HTMLElement>())
  const refs = React.useRef(new Map<string, (el: HTMLElement | null) => void>())
  const labelRef = React.useCallback((id: string) => {
    let ref = refs.current.get(id)
    if (!ref) {
      ref = (el: HTMLElement | null) => {
        if (el) elements.current.set(id, el)
        else elements.current.delete(id)
      }
      refs.current.set(id, ref)
    }
    return ref
  }, [])
  const [own, setOwn] = React.useState<Omit<LabelFitState, 'labelRef'>>(() => ({
    plans: new Map(),
    scale: 1,
    lines: initialLines,
    measured: false,
  }))

  // Only what changes the fit is a dependency: the labels and the settings.
  // Selection, commitment and settlement are not, deliberately.
  const itemsKey = items.map((i) => `${i.id}\u0000${i.label}\u0000${i.person ? 1 : 0}`).join('\u0001')
  const settingsKey = `${settings.labelFit}|${settings.maxLines}|${settings.minLines ?? ''}|${settings.shrinkFloor}|${settings.nameFormat}|${settings.groupFit}`
  const [width, setWidth] = React.useState(0)
  const [fontsSettled, setFontsSettled] = React.useState(0)

  React.useLayoutEffect(() => {
    const root = container.current
    if (!root || typeof window === 'undefined') return
    const plans = new Map<string, LabelPlan>()
    const released: Array<() => void> = []
    for (const item of items) {
      const label = elements.current.get(item.id)
      if (!label) continue
      const m = measurerFor(label)
      if (!m) continue
      released.push(m.release)
      plans.set(
        item.id,
        planLabel(item.label, {
          person: !!item.person,
          settings,
          measure: m.measure,
          floor: settings.labelFit === 'shrink' ? floorScale(m.basePx, settings.shrinkFloor) : 1,
        }),
      )
    }
    released.forEach((release) => release())
    if (plans.size === 0) return
    const maxLines = settings.labelFit === 'truncate' ? 1 : settings.maxLines
    const group = resolveGroup([...plans.values()], settings.groupFit, Math.min(settings.minLines ?? 1, maxLines))
    setOwn({ plans, ...group, measured: true })
    // The dependencies are the keys above, not the arrays they summarise.
  }, [itemsKey, settingsKey, width, fontsSettled])

  // A real resize or a font arriving re-fits; nothing else does.
  React.useEffect(() => {
    const root = container.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0)
      setWidth((prev) => (prev === next ? prev : next))
    })
    observer.observe(root)
    let live = true
    document.fonts?.ready.then(() => live && setFontsSettled((n) => n + 1))
    return () => {
      live = false
      observer.disconnect()
    }
  }, [container])

  // Sharing, only with a fitGroup.
  const key = React.useRef(Symbol('label-fit'))
  const id = settings.fitGroup
  React.useEffect(() => {
    if (!id || !own.measured) return
    publish(id, key.current, { scale: own.scale, lines: own.lines })
    const k = key.current
    return () => publish(id, k, undefined)
  }, [id, own.measured, own.scale, own.lines])
  const shared = React.useSyncExternalStore(
    React.useCallback(
      (onChange: () => void) => {
        if (!id) return () => {}
        const set = sharedListeners.get(id) ?? new Set()
        set.add(onChange)
        sharedListeners.set(id, set)
        return () => set.delete(onChange)
      },
      [id],
    ),
    () => (id ? JSON.stringify(combined(id) ?? null) : 'null'),
    () => 'null',
  )

  const across = JSON.parse(shared) as Shared | null
  if (across && settings.groupFit === 'uniform') {
    return {
      ...own,
      labelRef,
      scale: Math.min(own.scale, across.scale),
      lines: Math.max(own.lines, across.lines),
    }
  }
  return { ...own, labelRef }
}

/**
 * The attributes and custom properties a group root carries for its labels.
 * `--gs-label-block` reserves the group's line count on every label, and is
 * zero under `each`, so an unshared label takes only the room it needs.
 */
export function labelFitRootProps(
  settings: ResolvedLabelFitSettings,
  fit: LabelFitState,
): { 'data-gs-label-fit': LabelFit; 'data-gs-label-lines': number; style: React.CSSProperties } {
  return {
    'data-gs-label-fit': settings.labelFit,
    'data-gs-label-lines': fit.lines,
    style: {
      ['--gs-label-scale' as string]: fit.scale,
      ['--gs-label-lines' as string]: fit.lines,
      ['--gs-label-block' as string]: settings.groupFit === 'uniform' && fit.measured ? fit.lines : 0,
    },
  }
}
