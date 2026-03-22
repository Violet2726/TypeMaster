/**
 * 内置英文高频词库。
 *
 * 这份词库用于：
 * 1. 非 AI 模式下生成标准练习内容。
 * 2. AI 不可用时作为稳定兜底。
 *
 * 数据本身没有业务逻辑，因此单独放在 data 层，
 * 方便后续替换为更完整的分级词表。
 */
export const commonWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'each', 'being',
    'made', 'find', 'more', 'long', 'here', 'thing', 'very', 'still', 'own', 'should',
    'house', 'world', 'need', 'too', 'never', 'let', 'down', 'same', 'another', 'great',
    'must', 'home', 'big', 'high', 'school', 'through', 'every', 'old', 'does', 'public',
    'last', 'might', 'state', 'keep', 'feel', 'while', 'away', 'turn', 'both', 'few',
    'seem', 'put', 'much', 'mean', 'part', 'real', 'life', 'right', 'between', 'system',
    'such', 'show', 'hand', 'place', 'during', 'small', 'end', 'group', 'against', 'order',
    'begin', 'face', 'head', 'form', 'point', 'man', 'word', 'may', 'try', 'ask',
    'found', 'run', 'under', 'line', 'child', 'woman', 'side', 'before', 'move', 'increase',
    'early', 'late', 'consider', 'around', 'number', 'course', 'program', 'change', 'company'
];
