// Global variables
let emailData = [];
let charts = {};

// Utility functions
function parseDate(dateStr) {
    return new Date(dateStr);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function extractTopics(description) {
    const topics = [];
    const text = description.toLowerCase();
    
    // Common programming/tech topics
    const topicKeywords = {
        'javascript': ['javascript', 'js', 'react', 'node.js', 'vue', 'angular'],
        'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
        'web development': ['html', 'css', 'frontend', 'backend', 'full stack', 'responsive'],
        'machine learning': ['machine learning', 'ai', 'artificial intelligence', 'ml', 'neural network', 'deep learning'],
        'data science': ['data science', 'data analysis', 'visualization', 'statistics'],
        'mobile': ['mobile', 'android', 'ios', 'react native', 'flutter'],
        'cloud': ['aws', 'azure', 'cloud', 'docker', 'kubernetes'],
        'databases': ['database', 'sql', 'mongodb', 'postgresql', 'mysql'],
        'security': ['security', 'cybersecurity', 'encryption', 'authentication'],
        'game development': ['game', 'unity', 'unreal', 'gamedev'],
        'algorithms': ['algorithm', 'data structure', 'sorting', 'tree', 'graph'],
        'devops': ['devops', 'ci/cd', 'deployment', 'automation']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            topics.push(topic);
        }
    }

    return topics;
}

// Data loading and processing
async function loadEmailData() {
    try {
        const response = await fetch('emails.json');
        const data = await response.json();
        emailData = data.emails;
        console.log(`Loaded ${emailData.length} emails`);
        return emailData;
    } catch (error) {
        console.error('Error loading email data:', error);
        document.getElementById('recent-emails').innerHTML = '<p style="color: red;">Error loading email data</p>';
        return [];
    }
}

// Statistics calculations
function calculateBasicStats() {
    const totalEmails = emailData.length;
    const totalLinks = emailData.reduce((sum, email) => sum + (email.links ? email.links.length : 0), 0);
    const avgLinks = totalLinks / totalEmails;

    // Get date range
    const dates = emailData.map(email => parseDate(email.date)).filter(date => !isNaN(date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    document.getElementById('total-emails').textContent = formatNumber(totalEmails);
    document.getElementById('total-links').textContent = formatNumber(totalLinks);
    document.getElementById('avg-links').textContent = avgLinks.toFixed(1);
    document.getElementById('date-range').textContent = `${minDate.getFullYear()} - ${maxDate.getFullYear()}`;
}

function analyzeDurations() {
    const durations = {};
    let totalMinutes = 0;
    let itemCount = 0;

    emailData.forEach(email => {
        if (email.links) {
            email.links.forEach(link => {
                if (link.time_duration && link.time_type) {
                    const duration = parseInt(link.time_duration);
                    const type = link.time_type;
                    
                    // Convert to minutes
                    let minutes = duration;
                    if (type === 'hours' || type === 'hour') {
                        minutes = duration * 60;
                    }
                    
                    totalMinutes += minutes;
                    itemCount++;
                    
                    // Categorize duration
                    let category;
                    if (minutes <= 15) category = '≤15 min';
                    else if (minutes <= 60) category = '16-60 min';
                    else if (minutes <= 180) category = '1-3 hours';
                    else category = '3+ hours';
                    
                    durations[category] = (durations[category] || 0) + 1;
                }
            });
        }
    });

    return { durations, totalMinutes, itemCount };
}

function analyzeTopics() {
    const topicCounts = {};
    
    emailData.forEach(email => {
        if (email.links) {
            email.links.forEach(link => {
                const topics = extractTopics(link.description);
                topics.forEach(topic => {
                    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
                });
            });
        }
    });

    return Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
}

function analyzeQuoteAuthors() {
    const authorCounts = {};
    
    emailData.forEach(email => {
        if (email.quote_author) {
            const author = email.quote_author.trim();
            authorCounts[author] = (authorCounts[author] || 0) + 1;
        }
    });

    return Object.entries(authorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
}

function analyzeEmailsOverTime() {
    const monthCounts = {};
    
    emailData.forEach(email => {
        const date = parseDate(email.date);
        if (!isNaN(date)) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
    });

    return Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b));
}

// Chart creation functions
function createTimelineChart() {
    const timelineData = analyzeEmailsOverTime();
    const ctx = document.getElementById('emails-timeline').getContext('2d');

    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.map(([month]) => month),
            datasets: [{
                label: 'Emails per Month',
                data: timelineData.map(([, count]) => count),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createDurationChart() {
    const { durations } = analyzeDurations();
    const ctx = document.getElementById('duration-chart').getContext('2d');

    charts.duration = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(durations),
            datasets: [{
                data: Object.values(durations),
                backgroundColor: [
                    '#3498db',
                    '#e74c3c',
                    '#2ecc71',
                    '#f39c12'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createLinksDistributionChart() {
    const linkCounts = {};
    
    emailData.forEach(email => {
        const count = email.links ? email.links.length : 0;
        linkCounts[count] = (linkCounts[count] || 0) + 1;
    });

    const ctx = document.getElementById('links-distribution').getContext('2d');

    charts.linksDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(linkCounts).sort((a, b) => parseInt(a) - parseInt(b)),
            datasets: [{
                label: 'Number of Emails',
                data: Object.keys(linkCounts).sort((a, b) => parseInt(a) - parseInt(b)).map(key => linkCounts[key]),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Links per Email'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createTopicsChart() {
    const topicsData = analyzeTopics();
    const ctx = document.getElementById('topics-chart').getContext('2d');

    charts.topics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topicsData.map(([topic]) => topic),
            datasets: [{
                label: 'Mentions',
                data: topicsData.map(([, count]) => count),
                backgroundColor: '#f39c12',
                borderColor: '#e67e22',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        display: false
                    }
                },
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
}

// Insights generation
function generateInsights() {
    // Most productive period
    const timelineData = analyzeEmailsOverTime();
    const maxMonth = timelineData.reduce((max, current) => 
        current[1] > max[1] ? current : max, ['', 0]);
    document.getElementById('productive-period').textContent = 
        `${maxMonth[0]} with ${maxMonth[1]} emails published`;

    // Popular content types
    const { totalMinutes, itemCount } = analyzeDurations();
    const avgMinutes = totalMinutes / itemCount;
    const avgHours = (avgMinutes / 60).toFixed(1);
    document.getElementById('content-types').textContent = 
        `Average content duration: ${avgHours} hours. Most content focuses on hands-on tutorials and practical projects.`;

    // Time investment
    const totalHours = (totalMinutes / 60).toFixed(0);
    document.getElementById('time-investment').textContent = 
        `Total learning time across all content: ${formatNumber(totalHours)} hours. That's equivalent to ${Math.round(totalHours / 40)} weeks of full-time study!`;

    // Top quote authors
    const topAuthors = analyzeQuoteAuthors();
    const authorsList = topAuthors.slice(0, 3).map(([author, count]) => 
        `${author} (${count} quotes)`).join(', ');
    document.getElementById('quote-authors').textContent = authorsList;
}

// Recent emails display
function displayRecentEmails() {
    const recentEmails = emailData.slice(0, 5);
    const container = document.getElementById('recent-emails');
    
    container.innerHTML = recentEmails.map(email => `
        <div class="email-item fade-in">
            <div class="email-date">${email.date}</div>
            <div class="email-links">${email.links ? email.links.length : 0} links shared</div>
            ${email.quote ? `
                <div class="email-quote">
                    "${email.quote}"
                    <div class="quote-author">— ${email.quote_author || 'Unknown'}</div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Main initialization function
async function initDashboard() {
    console.log('Initializing dashboard...');
    
    try {
        await loadEmailData();
        
        if (emailData.length === 0) {
            throw new Error('No email data loaded');
        }

        // Calculate and display basic statistics
        calculateBasicStats();
        
        // Create charts
        createTimelineChart();
        createDurationChart();
        createLinksDistributionChart();
        createTopicsChart();
        
        // Generate insights
        generateInsights();
        
        // Display recent emails
        displayRecentEmails();
        
        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        
        // Display error message
        document.querySelector('.container').innerHTML = `
            <div style="text-align: center; padding: 50px; background: rgba(255,255,255,0.9); border-radius: 15px; margin: 20px;">
                <h2 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Dashboard Load Error</h2>
                <p style="color: #666; font-size: 1.1em;">Unable to load email data. Please ensure the emails.json file is available.</p>
                <p style="color: #999; margin-top: 10px;">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting dashboard initialization...');
    initDashboard();
});

// Handle window resize for responsive charts
window.addEventListener('resize', function() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
});