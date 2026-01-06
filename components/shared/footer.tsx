"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter, Youtube, Map } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/home" className="flex items-center gap-2 mb-6 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-transform group-hover:scale-105 overflow-hidden">
                                <Image
                                    src="/images/mova-logo.png"
                                    alt="MOVA Logo"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter">MOVA</span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                            Descoperă lumea prin experiențe autentice și planificare inteligentă. Ghidul tău personal pentru aventuri memorabile.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink icon={Facebook} href="#" />
                            <SocialLink icon={Instagram} href="#" />
                            <SocialLink icon={Twitter} href="#" />
                            <SocialLink icon={Youtube} href="#" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Navigare</h4>
                        <ul className="space-y-4">
                            <FooterLink href="/home" label="Acasă" />
                            <FooterLink href="/plan" label="Călătoriile Mele" />
                            <FooterLink href="/explore" label="Explorează" icon={<Map className="h-3.5 w-3.5" />} />
                            <FooterLink href="/bookings" label="Rezervări" />
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Resurse</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#" label="Despre Noi" />
                            <FooterLink href="#" label="Blog" />
                            <FooterLink href="#" label="Contact" />
                            <FooterLink href="#" label="Ajutor" />
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#" label="Termeni și Condiții" />
                            <FooterLink href="#" label="Politica de Confidențialitate" />
                            <FooterLink href="#" label="Politica Cookie" />
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-xs font-medium">
                        © {new Date().getFullYear()} MOVA Travel. Toate drepturile rezervate.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-slate-400 text-xs font-medium cursor-pointer hover:text-slate-900 transition-colors">Română (RO)</span>
                        <span className="text-slate-400 text-xs font-medium cursor-pointer hover:text-slate-900 transition-colors">RON</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FooterLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-slate-500 hover:text-mova-blue text-sm font-semibold transition-colors flex items-center gap-1.5">
                {label}
                {icon}
            </Link>
        </li>
    )
}

function SocialLink({ icon: Icon, href }: { icon: any; href: string }) {
    return (
        <a href={href} className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-mova-blue/10 hover:text-mova-blue transition-all">
            <Icon className="h-4 w-4" />
        </a>
    )
}
