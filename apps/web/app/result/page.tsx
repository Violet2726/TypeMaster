import { Suspense } from 'react';
import { PageLoadingFallback } from '../../src/application/PageLoadingFallback';
import ResultPage from '../../src/screens/ResultPage';

export default function Page() {
    return (
        <Suspense fallback={<PageLoadingFallback />}>
            <ResultPage />
        </Suspense>
    );
}
