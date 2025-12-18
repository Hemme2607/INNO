import Link from "next/link";

const links = [
    {
        title: 'Features',
        href: '#',
    },
    {
        title: 'Solution',
        href: '#',
    },
    {
        title: 'Customers',
        href: '#',
    },
    {
        title: 'Pricing',
        href: '#',
    },
    {
        title: 'Help',
        href: '#',
    },
    {
        title: 'About',
        href: '#',
    },
]

export default function FooterSection() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="transition hover:text-slate-200"
              >
                {link.title}
              </Link>
            ))}
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Sona. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
