function togglePopup(i) {
  for (j = 0; j < products1.length; j++) {
    document
      .getElementById(`product-grid-${j}`)
      .classList.toggle("product-grid");
  }
  document.getElementById(`popup-${i}`).classList.toggle("active");
}

function reviewtogglePopup(i) {
  console.log(i);
  for (j = 0; j < products1.length; j++) {
    document
      .getElementById(`product-grid-${j}`)
      .classList.toggle("product-grid");
  }
  document.getElementById(`review-popup-${i}`).classList.toggle("active");
}

function togglePopup1(i) {
  for (j = 0; j < bestsellers1.length; j++) {
    document
      .getElementById(`product-grid1-${j}`)
      .classList.toggle("product-grid");
  }
  for (j = 0; j < products1.length; j++) {
    document
      .getElementById(`product-grid-${j}`)
      .classList.toggle("product-grid");
  }
  document.getElementById(`popup1-${i}`).classList.toggle("active");
}

function reviewtogglePopup1(i) {
  console.log(i);
  for (j = 0; j < bestsellers1.length; j++) {
    document
      .getElementById(`product-grid1-${j}`)
      .classList.toggle("product-grid");
  }
  for (j = 0; j < products1.length; j++) {
    document
      .getElementById(`product-grid-${j}`)
      .classList.toggle("product-grid");
  }
  document.getElementById(`review-popup1-${i}`).classList.toggle("active");
}

$("#theCarousel").carousel({
  interval: 2000,
});
$(".multi-item-carousel").on("slide.bs.carousel", function (e) {
  let $e = $(e.relatedTarget),
    itemsPerSlide = 3,
    totalItems = $(".carousel-item", this).length,
    $itemsContainer = $(".carousel-inner", this),
    it = itemsPerSlide - (totalItems - $e.index());
  if (it > 0) {
    for (var i = 0; i < it; i++) {
      $(".carousel-item", this)
        .eq(e.direction == "left" ? i : 0)
        // append slides to the end/beginning
        .appendTo($itemsContainer);
    }
  }
});
