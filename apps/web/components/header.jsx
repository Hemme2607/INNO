'use client'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'

const menuItems = [
    { name: 'Demo', href: '#demo', sectionIndex: 2 },
    { name: 'Features', href: '#features', sectionIndex: 3 },
    { name: 'Integrations', href: '#integrations', sectionIndex: 4 },
    { name: 'FAQ', href: '#faq', sectionIndex: 5 },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    // Skifter nav-baggrund og padding når brugeren scroller ned
    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll);
    }, [])

    const handleNavClick = (event, href, sectionIndex) => {
        if (typeof window === 'undefined') return

        const targetById = document.querySelector(href)
        const fallbackTarget = document.querySelectorAll('section')[sectionIndex]
        const target = targetById ?? fallbackTarget

        if (!target) return

        event.preventDefault()

        const navOffset = 80
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navOffset

        window.scrollTo({
            top: Math.max(targetPosition, 0),
            behavior: 'smooth'
        })

        setMenuState(false)
    }

    return (
        <header>
            <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2">
                <div
                    className={cn(
                        'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
                        'bg-slate-950/80 rounded-2xl border-b border-white/5 backdrop-blur-md',
                        isScrolled && 'max-w-4xl lg:px-5'
                    )}>
                    <div
                        className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link href="/" aria-label="home" className="flex items-center space-x-2">
                                <span className="text-[12px] tracking-[0.28em] text-blue-200/80 drop-shadow-md">SONA AI</span>
                            </Link>

                            {/* Mobil-menu toggle */}
                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu
                                    className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X
                                    className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        {/* Desktop navigation */}
                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            onClick={(event) => handleNavClick(event, item.href, item.sectionIndex)}
                                            className="block text-sm font-medium text-slate-400 transition-colors hover:text-white">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Mobil navigation + CTA */}
                        <div
                            className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                onClick={(event) => handleNavClick(event, item.href, item.sectionIndex)}
                                                className="block text-sm font-medium text-slate-400 transition-colors hover:text-white">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button asChild size="sm" className={cn(isScrolled && 'lg:hidden')}>
                                    <Link href="#final-cta">Get early access</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
