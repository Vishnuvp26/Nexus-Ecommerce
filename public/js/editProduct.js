// Form Validation
function validateForm() {
    let productName = document.getElementById('productName').value.trim();
    let quantity = document.getElementById('quantity').value.trim();
    let price = document.getElementById('price').value.trim();
    let productDescription = document.getElementById('productDescription').value.trim();
    let images = document.querySelector(".file-upload-default");

    let nameRegex = /^[a-zA-Z0-9\s]+$/;
    let numberRegex = /^\d+$/;
    let priceRegex = /^\d+(\.\d{1,2})?$/;
    let isValid = true;

    document.getElementById('productNameError').innerText = '';
    document.getElementById('quantityError').innerText = '';
    document.getElementById('priceError').innerText = '';
    document.getElementById('productDescriptionError').innerText = '';
    document.getElementById('imageError').innerText = '';

    if (!nameRegex.test(productName)) {
        document.getElementById('productNameError').innerText = 'Product Name must be of only letters and numbers';
        isValid = false;
    }

    if (!quantity.match(numberRegex) || quantity < 0) {
        document.getElementById('quantityError').innerText = 'Quantity should not be a negetive number';
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

    for (let i = 0; i < images.files.length; i++) {
        let fileName = images.files[i].name;
        let extensions = /(\.jpg|\.jpeg|\.png)$/i;

        if (!extensions.test(fileName)) {
          document.getElementById('imageError').innerText = 'Select only valid Image files (jpg/jpeg/png)';
          isValid = false;
        }
    }
    return isValid;
};

// Remove images
let deletedIndices = [];
function removeImage(buttonElement, index) {
    const imageWrapper = buttonElement.closest('.image-wrapper');
    imageWrapper.remove();
    deletedIndices.push(index);
};

// Prevent Default
document.querySelector('.forms-sample').addEventListener('submit', (event) => {
    event.preventDefault();
    if (validateForm()) {
    editProduct();
    }
});


function handleFileSelect(event) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    const files = event.target.files;
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
            imageElement.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)'

            const removeButton = document.createElement('button');
            removeButton.innerText = 'x';
            removeButton.style.position = 'absolute';
            removeButton.style.top = '0';
            removeButton.style.right = '0';
            removeButton.style.color = 'rgb(255, 255, 255)';
            removeButton.style.backgroundColor = 'rgb(255, 0, 0)';
            removeButton.style.border = 'none';
            removeButton.style.borderRadius = '50%'
            removeButton.style.cursor = 'pointer';

            removeButton.onclick = function() {
                const newFiles = Array.from(files).filter((file, index) => index !== i);
                const fileList = new DataTransfer();
                newFiles.forEach(file => {
                    fileList.items.add(file);
                });
                event.target.files = fileList.files;
                handleFileSelect(event);
                document.getElementById('imageInput').value = '';
            };

            imageWrapper.appendChild(imageElement);
            imageWrapper.appendChild(removeButton);
            preview.appendChild(imageWrapper);
        };

        reader.readAsDataURL(files[i]);
    }
}

document.getElementById('imageInput').addEventListener('click', function() {
    this.value = '';
});

function editProduct() {
    const form = document.querySelector('.forms-sample');
    if (deletedIndices.length > 0) {
        const deletedIndicesInput = document.createElement('input');
        deletedIndicesInput.type = 'hidden';
        deletedIndicesInput.name = 'deletedIndices';
        deletedIndicesInput.value = JSON.stringify(deletedIndices);
        form.appendChild(deletedIndicesInput);
        deletedIndices = [];
    }

    
}