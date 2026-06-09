import { getCopy } from '../i18n';

export function getTrainingCopy(language = 'zh-CN') {
    return getCopy(language).training;
}
