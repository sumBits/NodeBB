"use strict";

/* globals app, define, utils, config, ajaxify, Sly */

define('paginator', ['forum/pagination'], function(pagination) {
	var paginator = {},
		frame,
		scrollbar,
		animationTimeout = null,
		index,
		count;
	
	paginator.init = function() {
		var options = {
			scrollBy: 200,
			speed: 200,
			easing: 'easeOutQuart',
			scrollBar: '#scrollbar',
			dynamicHandle: 1,
			dragHandle: 1,
			clickBar: 1,
			mouseDragging: 1,
			touchDragging: 1,
			releaseSwing: 1
		};
		
		frame = new Sly('#frame', options);
		frame.init();
		scrollbar = $('#scrollbar');

		$('html').addClass('paginated'); // allows this to work for non-JS browsers

		//todo key-bindings

		$(window).on('resize action:ajaxify.end', function() {
			paginator.reload();
		});

		frame.on('moveEnd', hideScrollbar);
		scrollbar.on('mouseout', hideScrollbar);

		frame.on('moveStart', showScrollbar);
		scrollbar.on('mouseover', showScrollbar);

		hideScrollbar();
	};

	paginator.reload = function() {
		frame.reload();
	};

	paginator.scrollToPost = function(postIndex, highlight, duration, offset) {
		if (!utils.isNumber(postIndex)) {
			return;
		}

		offset = offset || 0;
		duration = duration !== undefined ? duration : 400;
		paginator.scrollActive = true;

		if($('#post_anchor_' + postIndex).length) {
			return scrollToPid(postIndex, highlight, duration, offset);
		}

		if (config.usePagination) {
			if (window.location.search.indexOf('page') !== -1) {
				paginator.update();
				return;
			}

			var page = Math.ceil((postIndex + 1) / config.postsPerPage);

			if(parseInt(page, 10) !== pagination.currentPage) {
				pagination.loadPage(page, function() {
					scrollToPid(postIndex, highlight, duration, offset);
				});
			} else {
				scrollToPid(postIndex, highlight, duration, offset);
			}
		} else {
			paginator.scrollActive = false;
			postIndex = parseInt(postIndex, 10) + 1;
			ajaxify.go(generateUrl(postIndex));
		}
	};

	paginator.setCount = function(value) {
		count = parseInt(value, 10);
		updateTextAndProgressBar();
	};

	paginator.scrollTop = function(index) {
		if ($('li[data-index="' + index + '"]').length) {
			paginator.scrollToPost(index, true);
		} else {
			ajaxify.go(generateUrl());
		}
	};

	paginator.scrollBottom = function(index) {
		if (parseInt(index, 10) < 0) {
			return;
		}
		if ($('li[data-index="' + index + '"]').length) {
			paginator.scrollToPost(index, true);
		} else {
			index = parseInt(index, 10) + 1;
			ajaxify.go(generateUrl(index));
		}
	};

	paginator.setup = function(selector, count, toTop, toBottom, callback, calculateIndex) {
		index = 1;
		paginator.selector = selector;
		paginator.callback = callback;
		toTop = toTop || function() {};
		toBottom = toBottom || function() {};


		$(window).on('scroll', paginator.update);

	};

	paginator.update = function() {
		$($(paginator.selector).get().reverse()).each(function() {
			var el = $(this);

			if (elementInView(el)) {
				if (typeof paginator.callback === 'function') {
					index = paginator.callback(el, count);
					updateTextAndProgressBar();
				}

				return false;
			}
		});
	};

	function generateUrl(index) {
		var parts = window.location.pathname.split('/');
		return parts[1] + '/' + parts[2] + '/' + parts[3] + (index ? '/' + index : '');
	}

	function updateTextAndProgressBar() {
		index = index > count ? count : index;

		$('#pagination').translateHtml('[[global:pagination.out_of, ' + index + ', ' + count + ']]');
		$('.pagination-block .progress-bar').width((index / count * 100) + '%');
	}

	function elementInView(el) {
		var scrollTop = $(window).scrollTop() + $('#header-menu').height();
		var scrollBottom = scrollTop + $(window).height();

		var elTop = el.offset().top;
		var elBottom = elTop + Math.floor(el.height());
		return (elTop >= scrollTop && elBottom <= scrollBottom) || (elTop <= scrollTop && elBottom >= scrollTop);
	}

	function scrollToPid(postIndex, highlight, duration, offset) {
		var scrollTo = $('#post_anchor_' + postIndex);

		if (!scrollTo) {
			paginator.scrollActive = false;
			return;
		}

		var done = false;
		function animateScroll() {
			//todo, ask baris about duration

			frame.slideTo(scrollTo.offset().top - $('#header-menu').height() - offset);
			frame.one('moveEnd', function() {
				if (done) {
					return;
				}
				done = true;

				paginator.scrollActive = false;
				paginator.update();
				highlightPost();

				// what is this for
				$('body').scrollTop($('body').scrollTop() - 1);
				$('html').scrollTop($('html').scrollTop() - 1);
			});
		}

		function highlightPost() {
			if (highlight) {
				scrollTo.parent().find('.topic-item').addClass('highlight');
				setTimeout(function() {
					scrollTo.parent().find('.topic-item').removeClass('highlight');
				}, 3000);
			}
		}

		if ($('#post-container').length) {
			animateScroll();
		}
	}

	function hideScrollbar() {
		clearTimeout(animationTimeout);
		animationTimeout = setTimeout(function() {
			scrollbar.addClass('translucent');
		}, 3000);
	}

	function showScrollbar() {
		scrollbar.removeClass('translucent');
	}

	return paginator;
});