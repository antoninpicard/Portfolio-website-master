import './style.css';

import Application from './Application/Application';
import { isMobileDevice } from './Application/Utils/isMobileDevice';
import { renderMobileShowcase } from './Application/Mobile/MobileShowcase';

if (isMobileDevice()) {
    renderMobileShowcase();
} else {
    const app: Application = new Application();
}
