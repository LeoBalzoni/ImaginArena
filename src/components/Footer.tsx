import { Github, Instagram, Linkedin, Mail } from "lucide-react";

/**
 * Footer component displaying creator information and social links
 */
export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Built with ❤️ by{" "}
              <span className="font-semibold text-gray-900">
                Leonardo Balzoni
              </span>
            </p>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-6">
            <a
              href="https://github.com/LeoBalzoni"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">GitHub</span>
            </a>

            <a
              href="https://www.linkedin.com/in/leobalzoni/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>

            <a
              href="https://www.instagram.com/leo_balzoni/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors duration-200"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm font-medium">Instagram</span>
            </a>

            <a
              href="mailto:l.balzoni@gmail.com"
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Email</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
