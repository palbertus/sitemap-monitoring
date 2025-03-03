import React from 'react';
import { Menu, Home } from 'lucide-react';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavLink({ href, icon, label }: NavLinkProps) {
  return (
    <a
      href={href}
      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
    >
      {icon}
      <span className="ml-2 text-sm font-medium">{label}</span>
    </a>
  );
}

interface HeaderProps {
  title?: string;
  logo?: React.ReactNode;
  onSignOut: () => void;
  showNav?: boolean;
}

export function Header({ 
  title = 'Sitemap Monitor', 
  logo = <Menu className="w-6 h-6" />, 
  onSignOut,
  showNav = true 
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-600">
              {logo}
            </div>
            <div className="ml-4 text-xl font-semibold text-gray-900">
              {title}
            </div>
          </div>
          {showNav && (
            <nav className="flex space-x-8">
              <NavLink href="/" icon={<Home className="w-5 h-5" />} label="Home" />
              <button
                onClick={onSignOut}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                <span className="ml-2 text-sm font-medium">Sign Out</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}