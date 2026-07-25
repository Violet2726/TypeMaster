import Link from 'next/link';
export default function NotFound() {
    return (
        <div className="page not-found">
            <p className="eyebrow">404 · Signal absent</p>
            <h1>This rift no longer exists.</h1>
            <p>TypeRift v1 has one clear path. Historical routes are intentionally unavailable.</p>
            <Link className="tr-button tr-button--primary" href="/">
                Return to hub
            </Link>
        </div>
    );
}
