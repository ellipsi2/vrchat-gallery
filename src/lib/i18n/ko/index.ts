import { last } from 'lodash-es'

// http://yoonbumtae.com/?p=3677
function isEndWithConsonant(korStr: string) {
    const finalChrCode = korStr.charCodeAt(korStr.length - 1)
    // 0 = 받침 없음, 그 외 = 받침 있음
    const finalConsonantCode = (finalChrCode - 44032) % 28
    return finalConsonantCode !== 0
};

export function josa(kor: string): string {
    if (['을', '를'].includes(last(kor)!)) {
        return isEndWithConsonant(kor) ? `${kor}를` : `${kor}을`;
    } else {
        return isEndWithConsonant(kor) ? `${kor}이` : `${kor}가`;
    }
}