import React from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

const App = () => {
    return (
<h1 class="text-3xl font-bold text-blue-500">Hello Tailwind!</h1>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);