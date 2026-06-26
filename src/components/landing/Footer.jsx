import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Introo OS</h3>
            <p className="text-gray-600 dark:text-gray-400">All-in-one business operating system for modern teams.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li><Link to="/" className="hover:text-blue-600">Features</Link></li>
              <li><Link to="/" className="hover:text-blue-600">Pricing</Link></li>
              <li><Link to="/" className="hover:text-blue-600">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li><Link to="/" className="hover:text-blue-600">About</Link></li>
              <li><Link to="/" className="hover:text-blue-600">Blog</Link></li>
              <li><Link to="/" className="hover:text-blue-600">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li><Link to="/" className="hover:text-blue-600">Privacy</Link></li>
              <li><Link to="/" className="hover:text-blue-600">Terms</Link></li>
              <li><Link to="/" className="hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>© 2026 Introo OS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
