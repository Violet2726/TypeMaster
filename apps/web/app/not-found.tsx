import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="not-found">
            <p className="eyebrow">TYPEMASTER STUDIO</p>
            <h1>404</h1>
            <p>这段文字还没有写下。</p>
            <Link className="text-action" href="/">
                回到练习
            </Link>
        </main>
    );
}
