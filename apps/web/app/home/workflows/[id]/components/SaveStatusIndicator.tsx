'use client';
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
interface SaveStatusIndicatorProps {
    saveStatus: SaveStatus;
    lastSaveError: string | null;
}
export function SaveStatusIndicator({ saveStatus, lastSaveError, }: SaveStatusIndicatorProps) {
    if (saveStatus === 'saved') {
        return (<div className="group flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors duration-150 cursor-default">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 18">
          <path d="M14.157 6.326C12.633 5.724 10.7083 6 9.12499 7.3958C9.37499 6.125 11.4118 4.5058 13.523 4.608C12.61 3.047 10.922 2 9.02899 2C6.14399 2 3.79799 4.355 3.79799 7.25C3.79799 7.375 3.80299 7.5 3.81399 7.627C2.16899 8.045 0.96499 9.561 1.00199 11.334C1.02299 12.334 1.43099 13.265 2.14999 13.958C2.84999 14.632 3.76299 15 4.71499 15H12.516C14.989 15 17 12.982 17 10.499C16.997 8.64 15.869 7.003 14.157 6.326Z" fill="currentColor"/>
        </svg>
        <span>Saved</span>
      </div>);
    }
    if (saveStatus === 'saving') {
        return (<div className="flex items-center gap-1.5 text-sm text-white/60">
        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Saving...</span>
      </div>);
    }
    if (saveStatus === 'error') {
        return (<div className="flex items-center gap-1.5 text-sm text-red-400" title={lastSaveError || 'Failed to save'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 18 18">
          <path fillRule="evenodd" clipRule="evenodd" d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" fill="currentColor" fillOpacity="0.3"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M9 5.25C9.41421 5.25 9.75 5.58579 9.75 6V9.5C9.75 9.91421 9.41421 10.25 9 10.25C8.58579 10.25 8.25 9.91421 8.25 9.5V6C8.25 5.58579 8.58579 5.25 9 5.25Z" fill="currentColor"/>
          <path d="M9 12.75C9.55228 12.75 10 12.3023 10 11.75C10 11.1977 9.55228 10.75 9 10.75C8.44772 10.75 8 11.1977 8 11.75C8 12.3023 8.44772 12.75 9 12.75Z" fill="currentColor"/>
        </svg>
        <span>Error saving</span>
      </div>);
    }
    return null;
}
