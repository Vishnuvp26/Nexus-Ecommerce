// IMAGE CROPPER
 let cropper;
  let currentFileIndex = -1;
  let files = [];
  let images = [];

  function handleFileSelect(event) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    files = Array.from(event.target.files);
    images = files.slice();
    const filesAmount = files.length;

    document.getElementById('fileCount').value = filesAmount + ' files selected';

    for (let i = 0; i < filesAmount; i++) {
      const reader = new FileReader();

      reader.onload = function(event) {
        const imageWrapper = document.createElement('div');
        imageWrapper.style.position = 'relative';
        imageWrapper.style.display = 'inline-block';
        imageWrapper.style.marginRight = '10px';

        const imageElement = document.createElement('img');
        imageElement.src = event.target.result;
        imageElement.style.width = '100px';
        imageElement.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';

        const removeButton = document.createElement('button');
        removeButton.innerText = 'x';
        removeButton.style.position = 'absolute';
        removeButton.style.top = '0';
        removeButton.style.right = '0';
        removeButton.style.color = 'rgb(255, 255, 255)';
        removeButton.style.backgroundColor = 'rgb(255, 0, 0)';
        removeButton.style.border = 'none';
        removeButton.style.borderRadius = '50%';
        removeButton.style.cursor = 'pointer';
        removeButton.onclick = function() {
          const newFiles = images.filter((_, index) => index !== i);
          const fileList = new DataTransfer();

          newFiles.forEach(file => {
            fileList.items.add(file);
          });

          images = newFiles;
          document.getElementById('imageInput').files = fileList.files;
          handleFileSelect({
            target: {
              files: fileList.files
            }
          });

          document.getElementById('imageInput').value = '';
        };

        const cropButton = document.createElement('button');
        cropButton.type = 'button';
        cropButton.innerText = 'Crop';
        cropButton.style.position = 'absolute';
        cropButton.style.bottom = '0';
        cropButton.style.right = '30px';
        cropButton.style.color = 'white';
        cropButton.style.backgroundColor = 'green';
        cropButton.style.border = 'none';
        cropButton.style.borderRadius = '5px';
        cropButton.style.cursor = 'pointer';
        cropButton.onclick = function() {
          currentFileIndex = i;
          document.getElementById('cropperImage').src = event.target.result;
          $('#cropModal').modal('show');
          initializeCropper();
        };

        imageWrapper.appendChild(imageElement);
        imageWrapper.appendChild(removeButton);
        imageWrapper.appendChild(cropButton);
        preview.appendChild(imageWrapper);
      };

      reader.readAsDataURL(files[i]);
    }
  }

  function initializeCropper() {
    const image = document.getElementById('cropperImage');
    cropper = new Cropper(image, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
    });
  }

  document.getElementById('cropButton').addEventListener('click', function(event) {
    event.preventDefault(); 
    const canvas = cropper.getCroppedCanvas({
      width: 600,
      height: 600,
    });

    canvas.toBlob(function(blob) {
      const newFile = new File([blob], images[currentFileIndex].name, {
        type: 'image/png'
      });
      images[currentFileIndex] = newFile;

      const fileList = new DataTransfer();
      images.forEach(file => {
        fileList.items.add(file);
      });

      document.getElementById('imageInput').files = fileList.files;

      const url = URL.createObjectURL(blob);
      const imageElement = document.createElement('img');
      imageElement.src = url;
      imageElement.style.width = '100px';
      imageElement.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';

      const preview = document.getElementById('imagePreview');
      const imageWrappers = preview.getElementsByTagName('div');

      imageWrappers[currentFileIndex].replaceChild(imageElement, imageWrappers[currentFileIndex].getElementsByTagName('img')[0]);

      $('#cropModal').modal('hide');
      cropper.destroy();
    });
  });

  document.getElementById('imageInput').addEventListener('click', function() {
    this.value = '';
});


// FORM VALIDATION
document.addEventListener("DOMContentLoaded", function() {
  async function validateForm(event) {
    event.preventDefault();

    let productName = document.getElementById('productName').value.trim();
    let quantity = document.getElementById('quantity').value.trim();
    let price = document.getElementById('price').value.trim();
    let productDescription = document.getElementById('productDescription').value.trim();
    let highlights = document.getElementById('highlights').value.trim(); // New field
    let productDetails = document.getElementById('productDetails').value.trim(); // New field
    let images = document.querySelector(".file-upload-default");
    let category = document.getElementById('category').value;

    let nameRegex = /^[a-zA-Z0-9\s]+$/;
    let numberRegex = /^\d+$/;
    let priceRegex = /^\d+(\.\d{1,2})?$/;
    let isValid = true;

    // Clear previous error messages
    document.getElementById('productNameError').innerText = '';
    document.getElementById('quantityError').innerText = '';
    document.getElementById('priceError').innerText = '';
    document.getElementById('productDescriptionError').innerText = '';
    document.getElementById('imageError').innerText = '';
    document.getElementById('categoryError').innerText = '';
    document.getElementById('highlightsError').innerText = ''; 
    document.getElementById('productDetailsError').innerText = '';

    try {
      // Check if product name already exists
      const response = await axios.get(`/admin/checkAlready?productName=${encodeURIComponent(productName)}`);
      if (response.data.exists) {
        document.getElementById('productNameError').innerText = 'Product Name already exists';
        isValid = false;
      }
    } catch (error) {
      console.error('Error checking product name:', error);
      document.getElementById('productNameError').innerText = 'Error checking product name';
      isValid = false;
    }

    if (!nameRegex.test(productName)) {
      document.getElementById('productNameError').innerText = 'Product Name must be alphanumeric';
      isValid = false;
    }

    if (!category) {
      document.getElementById('categoryError').innerText = 'Category is required';
      isValid = false;
    }

    if (!quantity.match(numberRegex) || quantity <= 0) {
      document.getElementById('quantityError').innerText = 'Quantity should be at least 1';
      isValid = false;
    }

    if (!priceRegex.test(price) || price <= 0) {
      document.getElementById('priceError').innerText = 'Price must be a number greater than 0';
      isValid = false;
    }

    if (productDescription.length === 0) {
      document.getElementById('productDescriptionError').innerText = 'Product Description is required';
      isValid = false;
    }

    if (highlights.length === 0) { // New field
      document.getElementById('highlightsError').innerText = 'Highlights are required';
      isValid = false;
    }

    if (productDetails.length === 0) { // New field
      document.getElementById('productDetailsError').innerText = 'Product Details are required';
      isValid = false;
    }

    if (images.files.length < 3) {
      document.getElementById('imageError').innerText = 'Select at least three images';
      isValid = false;
    }

    for (let i = 0; i < images.files.length; i++) {
      let fileName = images.files[i].name;
      let extensions = /\.(jpg|jpeg|png)$/i;
      if (!extensions.test(fileName)) {
        document.getElementById('imageError').innerText = 'Select only valid Image files (jpg/jpeg/png)';
        isValid = false;
      }
    }

    if (isValid) {
      try {
        const formData = new FormData(event.target);
        const response = await axios.post('/admin/addProducts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Product added successfully',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            window.location.href = '/admin/products';
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: response.data.message
          });
        }
      } catch (error) {
        console.error('Error adding product:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to add product. Please try again.'
        });
      }
    } else {
        return false;
    }
  }

  document.querySelector('form').addEventListener('submit', validateForm);
});