for (const viewer of document.querySelectorAll('[data-floor-viewer]')) {
  const controls = viewer.querySelector('.mosina-floor-controls');
  const buttons = [...controls.querySelectorAll('button')];
  const panels = [...viewer.querySelectorAll('[data-floor-panel]')];

  function selectFloor(activeButton) {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button === activeButton));
    }

    for (const panel of panels) {
      panel.hidden = panel.id !== activeButton.getAttribute('aria-controls');
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => selectFloor(button));
  }

  selectFloor(buttons[0]);
  controls.hidden = false;
}
