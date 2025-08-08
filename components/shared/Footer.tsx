
import { FC, memo } from 'react';

/**
 * Functional Footer component.
 * Renders the site footer with strict typing and composable structure.
 * Uses memo for performance.
 */
const Footer: FC = memo(() => (
  <footer
    className='flex flex-col align-center'
    style={{
      width: '100%',
      backgroundColor: 'black',
      color: 'white',
      paddingBlock: '1rem',
      paddingInline: '2rem',
    }}
  >
    <p>© 2024 Sollark. All rights reserved.</p>
    <p>
      This project is licensed under the MIT License. View the{' '}
      <a
        href='https://github.com/your-username/your-repository'
        target='_blank'
        rel='noopener noreferrer'
      >
        GitHub repository
      </a>{' '}
      for more information.
    </p>
  </footer>
));

export default Footer;
