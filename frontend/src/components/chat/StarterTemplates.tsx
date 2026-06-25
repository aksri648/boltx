import React, { useEffect, useState } from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => (
  <a
    href={`/git?url=https://github.com/${template.githubRepo}.git`}
    data-state="closed"
    data-discover="true"
    className="items-center justify-center"
  >
    <div
      className={`inline-block ${template.icon} w-8 h-8 text-4xl transition-theme hover:text-purple-500 dark:text-white dark:opacity-50 dark:hover:opacity-100 dark:hover:text-purple-400 transition-all grayscale hover:grayscale-0 transition`}
      title={template.label}
    />
  </a>
);

const StarterTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>(() => [...STARTER_TEMPLATES]);

  useEffect(() => {
    let mounted = true;

    // fetchConfig() is called in main.tsx on startup, which mutates the exported
    // STARTER_TEMPLATES let variable. Re-read it after a short delay to pick up
    // any dynamically loaded templates from the backend.
    const timer = setTimeout(() => {
      if (mounted) {
        // Re-import to read the live value after fetchConfig() has updated it
        import('~/utils/constants').then((mod) => {
          if (mounted) {
            setTemplates([...mod.STARTER_TEMPLATES]);
          }
        }).catch(() => {
          // Ignore - keep using the initial value
        });
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm text-gray-500">or start a blank app with your favorite stack</span>
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center items-center gap-4 max-w-sm">
          {templates.map((template) => (
            <FrameworkLink key={template.name} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarterTemplates;
