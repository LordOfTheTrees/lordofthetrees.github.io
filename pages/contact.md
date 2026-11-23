---
layout: page
title: Contact
permalink: /pages/contact/
prose: true
description: "Contact Andrew Erbs about advisory work, a collaboration, speaking, or a role. LinkedIn is the fastest route. A short form is on the page, and anonymous feedback is separate."
last_modified_at: 2026-11-23
redirect_from:
  - /TreePage/pages/contact/
---


## What to reach out about

I am open to advisory projects, collaborations, speaking, and conversations about roles.

- **Applied AI systems that ship.** [OctagonELO](https://octagonelo.com) publishes pre-fight MMA probabilities. [Combat Cognition]({{ '/posts/combat-cognition-beta-announcement/' | relative_url }}) is a training app for the hours between classes.
- **Analytics and measurement.** Experimentation, attribution, and data products. The [quarterback evaluation framework]({{ '/posts/quantifying_QB_success_Pt_1/' | relative_url }}) uses era-adjusted stats and ridge regression to test which numbers track a second contract.
- **Product strategy for data-heavy tools.** Those three are the examples already on this site: a live prediction product, a training product, and a measurement framework. The full set is on [Projects]({{ '/pages/projects/' | relative_url }}).

## What to include

Say what the problem is, what you have already tried, and what a useful next step would look like. If a date matters, include it.

LinkedIn is the fastest route: [Andrew Erbs](https://www.linkedin.com/in/andrew-erbs-59bb9365). Code and project history are on [GitHub](https://github.com/LordOfTheTrees). The form below comes through as well.

Prefer to give candid, anonymous feedback instead? Use the [Anonymous Feedback]({{ site.baseurl }}/pages/feedback/) page — no name or email required.

## Contact Form
{: #contact-form-heading}

<form id="contact-form">
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  
  <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  
  <div class="form-group">
    <label for="subject">Subject:</label>
    <input type="text" id="subject" name="subject">
  </div>
  
  <div class="form-group">
    <label for="message">Message:</label>
    <textarea id="message" name="message" rows="5" required></textarea>
  </div>
  
  <div class="form-group hp-field" aria-hidden="true">
    <label for="contact-website">Website (leave blank)</label>
    <input type="text" id="contact-website" name="website" tabindex="-1" autocomplete="off">
  </div>

  <button type="submit" class="button">Send Message</button>
  <div id="form-status" class="form-status" hidden></div>
</form>