var isDirty = function () {
  return false;
}
var formSubmitting = false;
window.onload = function () {
  window.addEventListener("beforeunload", function (e) {
    if (formSubmitting || isDirty()) {
      return undefined;
    }

    var confirmationMessage = 'It looks like you have been editing something. ' +
      'If you leave before saving, your changes will be lost.';
    Gg();
    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
  });
};
