import pandas as pd

# Load the CSV data
file_path = 'deaths.csv'  # Replace with your actual file path
df = pd.read_csv(file_path)

# Extract records of the specified countries
countries = ['United States', 'United Kingdom', 'Turkey', 'Germany']
df_filtered = df[df['country'].isin(countries)]

# Remove records without the last three columns
df_filtered = df_filtered.dropna(subset=['expected_deaths', 'excess_deaths', 'baseline'])

# Drop unnecessary columns
df_filtered = df_filtered.drop(columns=['month', 'week', 'baseline', 'placename', 'frequency'])

# Sum up deaths, expected deaths, and excess deaths for the year 2020 for each country
df_2020 = df_filtered[df_filtered['year'] == "2020"]
df_summed = df_2020.groupby('country').agg({
    'deaths': 'sum',
    'expected_deaths': 'sum',
    'excess_deaths': 'sum'
}).reset_index()

# Calculate the percentage of excess deaths vs total deaths
df_summed['excess_deaths_percentage'] = (df_summed['excess_deaths'] / df_summed['deaths']) * 100
print(df_summed)
# Convert the DataFrame to JSON format
result_json = df_summed.to_dict(orient='records')

# Save the JSON data to a file
output_file_path = 'summed_deaths_2020.json'  # Replace with your desired output file path
with open(output_file_path, 'w') as json_file:
    import json
    json.dump(result_json, json_file, indent=4)

# Display the results
print(json.dumps(result_json, indent=4))
