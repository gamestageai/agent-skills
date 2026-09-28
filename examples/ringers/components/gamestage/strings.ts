'use client'

import * as React from 'react'

/**
 * Every library-owned word, preserving today's English and capitalisation.
 * Keys are scoped by registry component name. Machine values (states, field
 * names, presentations) stay in components; only their spoken words live here.
 * Keep interpolated phrases whole so a translation can reorder their values.
 * Plural rules belong in the host's function overrides, not in this module.
 *
 * Components read these entries with or without a provider above them.
 */
export const defaultStrings = {
  'button.locked': 'locked',

  'chart.plotLabel': (label: string) => `${label}. Use the arrow keys to read each point`,
  'chart.point': (title: string, values: string) => `${title}: ${values}`,
  'chart.pointHeading': 'Point',
  'chart.roledescription': 'chart',
  'chart.seriesHeading': 'Series',
  'chart.tableCaption': (label: string) => `${label}, as a table`,
  'chart.valueHeading': 'Value',

  'chat-stream.gap': (count: number) => `You were away · ${count} messages`,
  'chat-stream.hostPaused': 'Chat is paused by the host',
  'chat-stream.label': 'chat',
  'chat-stream.paused': 'paused',
  'chat-stream.pausedLabel': (label: string, paused: string) => `${label}, ${paused}`,
  'chat-stream.resume': (count: number) => `${count} new · Resume`,

  'choice.correct': 'correct',
  'choice.commitLabel': 'Lock it in',
  'choice.lockedIn': 'locked in',
  'choice.rewarded': 'rewarded',
  'choice.selected': 'selected',
  'choice.wrong': 'wrong',

  'coach-mark.current': 'current',
  'coach-mark.dismissLabel': 'Dismiss',
  'coach-mark.step': (step: number, max: number) => `Step ${step} of ${max}`,

  'code-entry.label': 'One-time code',
  'code-entry.resendLabel': 'Send another code',
  'code-entry.resendIn': (time: string) => `Resend in ${time}`,
  'code-entry.submitLabel': 'Verify',
  'code-entry.title': 'Check your email',

  'consent.accept': 'Accept',
  'consent.analytics': 'Measure how the game is played',
  'consent.choose': 'Manage preferences',
  'consent.close': 'Close',
  'consent.detail': '{brand} would like to record analytics on how you play, so we can improve the game. We only do this if you agree. Data needed to run the game, such as your scores, is processed on the basis of legitimate interests.',
  'consent.functional': 'Remember my preferences',
  'consent.marketing': "Offers and news from the game's owner",
  'consent.necessary': 'Needed for the game to work. Always on.',
  'consent.policy': 'Privacy policy',
  'consent.reject': 'Reject',
  'consent.save': 'Save my choices',
  'consent.title': 'Your privacy',

  'composer.cancelReply': 'Stop replying',
  'composer.going': 'going',
  'composer.label': 'Your message',
  'composer.left': (count: number) => `${count} left`,
  'composer.limited': (seconds: number) => `You can post again in ${seconds}s`,
  'composer.placeholder': 'Say something',
  'composer.screening': 'Checking your message',
  'composer.sendLabel': 'Send',

  'discovery.ended': 'ended',
  'discovery.live': 'live',
  'discovery.upcoming': 'starts soon',

  'empty-state.stateWord': 'nothing here yet',

  'feedback.correct': 'Correct',
  'feedback.correctDelta': (label: string, delta: string) => `${label} ${delta}`,
  'feedback.delta': (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : String(value),
  'feedback.dismiss': (name: string) => `${name}. Dismiss`,
  'feedback.earned': 'Earned',
  'feedback.reward': 'Reward',
  'feedback.score': 'Score',
  'feedback.wrong': 'Wrong',

  'field.hidden': 'Show',
  'field.hidePassword': 'Hide password',
  'field.optional': 'Optional.',
  'field.required': 'Required.',
  'field.showPassword': 'Show password',
  'field.shown': 'Hide',

  'form.busyLabel': 'Sending',
  'form.summaryLabel': 'Errors',

  'hud.label': 'game status',

  'identity.away': 'away',
  'identity.guest': 'Guest',
  'identity.offline': 'offline',
  'identity.online': 'online',
  'identity.player': 'Player',
  'identity.signedOut': 'signed out',
  'identity.you': 'you',

  'inventory.count': (label: string, count: number) => `${label}, ${count}`,
  'inventory.empty': 'nothing here yet',
  'inventory.emptyLabel': 'Nothing yet',
  'inventory.filtersLabel': 'Filter',
  'inventory.valueOfMax': (value: number, max: number) => `${value} of ${max}`,

  'leaderboard.empty': 'nothing here yet',
  'leaderboard.emptyBody': 'Play a round and this fills up.',
  'leaderboard.emptyHeading': 'No scores yet',
  'leaderboard.label': 'leaderboard',
  'leaderboard.movedDown': (count: number) => `moved down ${count}`,
  'leaderboard.movedDownTo': (you: string, rank: number) => `${you}, moved down to ${rank}`,
  'leaderboard.movedUp': (count: number) => `moved up ${count}`,
  'leaderboard.movedUpTo': (you: string, rank: number) => `${you}, moved up to ${rank}`,
  'leaderboard.score': (label: string, value: number) => `${label} ${value}`,
  'leaderboard.scoreLabel': 'score',
  'leaderboard.seeAll': 'See all',
  // A rank more than one row holds: "=1". GSUI, 2026-09-27.
  'leaderboard.sharedRank': (rank: number) => `=${rank}`,
  'leaderboard.seeAllLabel': (count: number) => `See all ${count} players`,
  'leaderboard.you': 'you',

  'level-ring.complete': 'complete',
  'level-ring.inProgress': 'in progress',
  'level-ring.label': 'progress',
  'level-ring.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,

  'login.divider': 'or',
  'login.guestLabel': 'Play as guest',
  'login.identifierLabel': 'Email',
  'login.submitLabel': 'Continue',
  'login.title': 'Sign in to play',

  'media-frame.busy': 'working',
  'media-frame.empty': 'nothing here yet',
  'loading.label': 'Loading',
  'loading.progress': (percent: number) => `Loading, ${percent}%`,

  'media-frame.loading': 'Loading',
  'media-frame.loadingLabel': (loading: string, label: string) => `${loading} ${label}`,
  'media-frame.playing': 'playing',

  'message.held': 'With a moderator',
  'message.host': 'Host',
  'message.label': (author: string, state: string) => `${author}, ${state}`,
  'message.player': 'Player',
  'message.published': 'posted',
  'message.refused': 'Not posted · house rules',
  'message.screening': 'Being checked · only you can see this',
  'message.sending': 'Sending',
  'message.system': 'System',
  'message.you': 'You',

  'milestones.complete': 'complete',
  'milestones.current': 'current',
  'milestones.label': 'milestones',
  'milestones.locked': 'locked',
  'milestones.reached': (count: number, total: number) => `${count} of ${total} reached`,

  'moderation-notice.blockLabel': 'Hide everything from this player',
  'moderation-notice.blockLabelFor': (name: string) => `Hide everything from ${name}`,
  'moderation-notice.heldBody': 'It will post if it passes. You can keep chatting while you wait.',
  'moderation-notice.heldHeading': 'A moderator is reading this',
  'moderation-notice.menuLabel': 'Message options',
  'moderation-notice.menuLabelFor': (name: string) => `Options for ${name}`,
  'moderation-notice.refusedBody': 'This one breaks the house rules. Edit it and try again.',
  'moderation-notice.refusedHeading': 'Not posted',
  'moderation-notice.replyLabel': 'Reply',
  'moderation-notice.reportLabel': 'Report this message',

  'moment.label': (headline: string) => `Moment: ${headline}`,
  'moment.result': 'Result',
  'moment.settledLabel': (headline: string, share: number) => `Result: ${headline}, ${share}% of the room`,
  'moment.share': (share: number) => `${share}%`,

  'multiplier.value': (value: number) => `x${value}`,

  'nav.current': 'current',
  'nav.label': 'sections',
  'nav.locked': 'locked',

  'onboarding.backLabel': 'Back',
  'onboarding.complete': 'complete',
  'onboarding.current': 'current',
  'onboarding.dismissLabel': 'Skip',
  'onboarding.label': 'getting started',
  'onboarding.nextLabel': 'Next',
  'onboarding.step': (step: number, max: number) => `step ${step} of ${max}`,

  'player-card.correct': 'correct',
  'player-card.guest': 'Guest',
  'player-card.lockedIn': 'locked in',
  'player-card.name': (eyebrow: string, name: string) => `${eyebrow} ${name}`,
  'player-card.player': 'Player',
  'player-card.rewarded': 'rewarded',
  'player-card.selected': 'selected',
  'player-card.wrong': 'wrong',

  'podium.empty': 'nothing here yet',
  'podium.sharedRank': (rank: number) => `=${rank}`,
  'podium.emptyBody': 'The top three appear once the round settles.',
  'podium.emptyHeading': 'No podium yet',
  'podium.label': 'podium',
  'podium.movedDown': (count: number) => `moved down ${count}`,
  'podium.movedUp': (count: number) => `moved up ${count}`,
  'podium.score': (label: string, value: number) => `${label} ${value}`,
  'podium.scoreLabel': 'score',
  'podium.you': 'you',

  'presence.empty': 'nothing here yet',
  'presence.label': 'playing now',
  'presence.names': (names: string[]) => {
    if (names.length === 0) return ''
    if (names.length === 1) return `${names[0]} is in`
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are in`
  },

  'prize-entry.blockedLabel': 'Accept terms to enter',
  'prize-entry.doneLabel': 'Back to the game',
  'prize-entry.enteredTitle': "You're in",
  'prize-entry.submitLabel': 'Enter the draw',

  'profile.label': 'Profile',
  'profile.rewardsLabel': 'Rewards',

  'progress-bar.complete': 'complete',
  'progress-bar.inProgress': 'in progress',
  'progress-bar.label': 'progress',
  'progress-bar.range': (from: string | number, to: string | number) => `${from} to ${to}`,
  'progress-bar.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,

  'quest.complete': 'complete',
  'quest.locked': 'locked',
  'quest.reward': (reward: string) => `reward ${reward}`,
  'quest.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,

  'reactions.label': 'Reactions',
  'reactions.pickLabel': 'Add a reaction',
  'reactions.reaction': (emote: string, count: number) => `${emote}, ${count}`,
  'reactions.reactionYours': (reaction: string, yours: string) => `${reaction}, ${yours}`,
  'reactions.yours': 'yours',

  'recovery-code.codeLabel': 'Your recovery code',
  'recovery-code.copied': 'Copied',
  'recovery-code.copy': 'Copy',
  'recovery-code.enterDetail': 'Type the recovery code you saved to get your progress back.',
  'recovery-code.enterTitle': "I've played before",
  'recovery-code.label': 'Recovery code',
  'recovery-code.placeholder': 'quiet finch river cedar 42',
  'recovery-code.private': 'Keep it private. Anyone with this code can play as you.',
  'recovery-code.replace': 'Getting a new code stops this one working.',
  'recovery-code.share': 'Share',
  'recovery-code.showDetail': 'It brings your name, scores and achievements back on another phone or browser. You only see it once, so save it now.',
  'recovery-code.showTitle': 'Keep your progress',
  'recovery-code.submit': 'Get my progress back',

  'reward.action': (action: string, label: string) => `${action}, ${label}`,
  'reward.available': 'available',
  'reward.claimLabel': 'Claim',
  'reward.claimed': 'claimed',
  'reward.count': (count: number) => `x${count}`,
  'reward.earned': 'earned',
  'reward.locked': 'locked',
  'reward.newLabel': 'New',
  'reward.revealLabel': 'Tap to reveal',
  'reward.waiting': 'waiting',

  'row.correct': 'correct',
  'row.wrong': 'wrong',

  'score.label': 'score',
  'score.updated': 'updated',
  'score.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,

  'segments.complete': 'complete',
  'segments.current': 'current',
  'segments.empty': 'to go',
  'segments.label': 'progress',
  'segments.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,
  'segments.wrong': 'wrong',

  'selector.charging': 'charging',
  'selector.correct': 'correct',
  'selector.commitLabel': 'Lock it in',
  'selector.disabled': 'unavailable',
  'selector.down': 'down',
  'selector.holdToCommit': 'hold to commit',
  'selector.left': 'left',
  'selector.locked': 'locked',
  'selector.lockedIn': 'locked in',
  'selector.next': (label: string) => `next ${label}`,
  'selector.nothingSelected': 'nothing selected',
  'selector.previous': (label: string) => `previous ${label}`,
  'selector.rewarded': 'rewarded',
  'selector.right': 'right',
  'selector.selected': 'selected',
  'selector.selection': (label: string, state: string) => `${label} ${state}`,
  'selector.swipe': (direction: string) => `swipe ${direction}`,
  'selector.swipeFor': (direction: string, label: string) => `swipe ${direction} for ${label}`,
  'selector.up': 'up',
  'selector.wrong': 'wrong',

  'slider.commitLabel': 'Lock it in',
  'slider.committedLabel': 'Locked in',
  'slider.committedValue': (label: string, value: string) => `${label} · ${value}`,
  'slider.locked': 'locked',
  'slider.lockedIn': 'locked in',
  'slider.selected': 'selected',
  'slider.withUnit': (value: string, unit: string) => `${value} ${unit}`,

  'stat.complete': 'complete',
  'stat.going': 'going',
  'stat.level': 'level',
  'stat.lives': 'lives',
  'stat.multiplier': 'multiplier',
  'stat.paused': 'paused',
  'stat.rank': 'rank',
  'stat.round': 'round',
  'stat.runningOut': 'running out',
  'stat.score': 'score',
  'stat.status': 'status',
  'stat.streak': 'streak',
  'stat.timer': 'timer',
  'stat.updated': 'updated',
  'stat.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,
  'stat.xp': 'xp',

  'status.complete': 'Complete',
  'status.go': 'Go!',
  'status.paused': 'Paused',
  'status.ready': 'Ready',

  'story.complete': 'complete',
  'story.current': 'current',
  'story.empty': 'nothing here yet',
  'story.label': 'story',
  'story.nextLabel': 'next',
  'stage.closeLabel': 'Close',

  'story.previousLabel': 'previous',
  'story.skipLabel': 'Skip',
  'story.toGo': 'to go',
  'story.valueOfMax': (value: string | number, max: number) => `${value} of ${max}`,

  'streak.value': (value: number) => `x${value}`,

  'tip.dismissLabel': 'Dismiss',

  'toggle.locked': 'locked',

  'tutorial-step.backLabel': 'Back',
  'tutorial-step.complete': 'complete',
  'tutorial-step.current': 'current',
  'tutorial-step.locked': 'locked',
  'tutorial-step.nextLabel': 'Next',
  'tutorial-step.step': (step: number, max: number) => `step ${step} of ${max}`,
  'tutorial-step.stepLabel': (step: number, max: number) => `Step ${step} of ${max}`,

  'versus.divider': 'vs',
  'versus.draw': 'drawn',
  'versus.label': 'Head to head',
  'versus.loss': 'lost',
  'versus.opponent': 'Opponent',
  'versus.player': 'You',
  'versus.win': 'won',

  'vote.label': (count: number) => `${count} votes`,
  'vote.labelState': (label: string, state: string) => `${label}, ${state}`,
  'vote.top': 'top message',
  'vote.voted': 'voted',
}

/** Complete vocabulary, including each formatter's argument types. */
export type Strings = typeof defaultStrings
export type StringsOverrides = Partial<Strings>

const StringsContext = React.createContext<Strings>(defaultStrings)

/** Missing values fall through; an explicit empty string is a real override. */
function mergeStrings(base: Strings, overrides?: StringsOverrides): Strings {
  if (!overrides) return base
  return {
    ...base,
    ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined)),
  }
}

export interface StringsProviderProps {
  strings: StringsOverrides
  children?: React.ReactNode
}

/**
 * Optional app-wide vocabulary. Changing `strings` updates consumers through
 * React context. Nested providers inherit the vocabulary above them.
 *
 * <StringsProvider strings={{ 'choice.lockedIn': 'Zatwierdzono' }}>
 *   {children}
 * </StringsProvider>
 */
export function StringsProvider({ strings, children }: StringsProviderProps) {
  const parent = React.useContext(StringsContext)
  const value = React.useMemo(() => mergeStrings(parent, strings), [parent, strings])
  return React.createElement(StringsContext.Provider, { value }, children)
}

/** Defaults, then the provider, then one instance's `strings` prop. Last wins. */
export function useStrings(strings?: StringsOverrides): Strings {
  const provided = React.useContext(StringsContext)
  return React.useMemo(() => mergeStrings(provided, strings), [provided, strings])
}

/**
 * Keep a numeric value's existing markup inside a translated phrase, wherever
 * the formatter puts it. Match a whole number so 2 does not select the 2 in 24.
 * If the translation formats the value differently, render its complete text.
 */
export function withStringValue(text: string, value: string, content: React.ReactNode): React.ReactNode {
  if (!value) return text
  let at = text.indexOf(value)
  while (at !== -1) {
    const end = at + value.length
    if (!/\p{N}/u.test(text[at - 1] ?? '') && !/\p{N}/u.test(text[end] ?? '')) {
      return React.createElement(React.Fragment, null, text.slice(0, at), content, text.slice(end))
    }
    at = text.indexOf(value, at + value.length)
  }
  return text
}
