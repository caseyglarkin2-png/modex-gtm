/**
 * Does a note sound like a buyer's own words? Then it belongs in Buyer Truth
 * Capture (where only what Casey confirms counts), not in a signal or a
 * person's note. One definition, shared by Share to GAP and Add a person.
 */
export const BUYER_WORDS = /\b(said|says|told me|told us|mentioned|according to|quote|asked|asks|wants|worried|complain\w*|struggl\w*|frustrat\w*)\b|[“"]/i;

export const soundsLikeBuyerWords = (note: string | null | undefined): boolean => !!note && BUYER_WORDS.test(note);
