const form = document.getElementById('delivery-form');
    const formError = document.getElementById('form-error');
    const requestFormSection = document.getElementById('request-form-section');
    const waitingScreen = document.getElementById('waiting-screen');
    const cancelledScreen = document.getElementById('cancelled-screen');
    const successDialog = document.getElementById('success-dialog');
    const cancelDialog = document.getElementById('cancel-dialog');

    const fields = [
      document.getElementById('pickup-location'),
      document.getElementById('dropoff-location'),
      document.getElementById('package-description'),
      document.getElementById('package-size'),
      document.getElementById('customer-note')
    ];

    function clearFieldError(field) {
      const wrapper = field.closest('.field');
      const error = wrapper.querySelector('.field-error');
      wrapper.classList.remove('has-error');
      error.textContent = '';
    }

    function setFieldError(field, message) {
      const wrapper = field.closest('.field');
      const error = wrapper.querySelector('.field-error');
      wrapper.classList.add('has-error');
      error.textContent = message;
    }

    function validateForm() {
      let isValid = true;
      formError.textContent = '';

      const pickup = document.getElementById('pickup-location');
      const dropoff = document.getElementById('dropoff-location');
      const description = document.getElementById('package-description');
      const size = document.getElementById('package-size');

      fields.forEach((field) => {
        if (field !== document.getElementById('customer-note')) {
          clearFieldError(field);
        }
      });

      if (!pickup.value.trim()) {
        setFieldError(pickup, 'Please choose a pickup location.');
        isValid = false;
      }

      if (!dropoff.value.trim()) {
        setFieldError(dropoff, 'Please choose a drop-off location.');
        isValid = false;
      }

      if (!description.value.trim()) {
        setFieldError(description, 'Please add a brief description of the package.');
        isValid = false;
      }

      if (!size.value.trim()) {
        setFieldError(size, 'Please choose a package size.');
        isValid = false;
      }

      if (!isValid) {
        formError.textContent = 'Please complete the required fields so riders can review your delivery request.';
      }

      return isValid;
    }

    function populateWaitingSummary() {
      const pickup = document.getElementById('pickup-location').value;
      const dropoff = document.getElementById('dropoff-location').value;
      const description = document.getElementById('package-description').value.trim();
      const size = document.getElementById('package-size').value;
      const note = document.getElementById('customer-note').value.trim();

      document.getElementById('summary-pickup').textContent = pickup || 'Not provided';
      document.getElementById('summary-dropoff').textContent = dropoff || 'Not provided';
      document.getElementById('summary-description').textContent = description || 'Not provided';
      document.getElementById('summary-size').textContent = size || 'Not provided';

      const noteWrap = document.getElementById('summary-note-wrap');
      const summaryNote = document.getElementById('summary-note');
      if (note) {
        summaryNote.textContent = note;
        noteWrap.hidden = false;
      } else {
        summaryNote.textContent = '';
        noteWrap.hidden = true;
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateForm()) {
        return;
      }

      successDialog.showModal();
    });

    document.getElementById('wait-for-rider').addEventListener('click', () => {
      successDialog.close();
      populateWaitingSummary();
      requestFormSection.hidden = true;
      waitingScreen.hidden = false;
    });

    document.getElementById('open-cancel').addEventListener('click', () => {
      cancelDialog.showModal();
    });

    document.getElementById('keep-request').addEventListener('click', () => {
      cancelDialog.close();
    });

    document.getElementById('confirm-cancel').addEventListener('click', () => {
      cancelDialog.close();
      waitingScreen.hidden = true;
      cancelledScreen.hidden = false;
    });
