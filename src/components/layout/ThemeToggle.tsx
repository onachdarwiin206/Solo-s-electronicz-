import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors flex items-center justify-center min-w-[36px]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' && (
        <Moon size={18} className="text-muted-foreground hover:text-foreground" />
      )}
      {theme === 'glass' && (
        <Sparkles size={18} className="text-blue-400 animate-pulse" />
      )}
    </motion.button>
  );
}
